import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { getRedisClient } from '../config/redis';
import { hashFingerprint, sanitizeText, generateShareCode } from '../utils/helpers';
import { markIpVoted, hasIpVoted } from '../middleware/rateLimit';
import { Server as SocketServer } from 'socket.io';

const router = Router();

let io: SocketServer | null = null;

export function setSocketIO(socketIO: SocketServer) {
  io = socketIO;
}

/*
 POST /api/polls
 Body: { question: string, options: string[], fingerprint?: string }
 Creates a new poll with the given question and options.
*/
router.post('/', async (req: Request, res: Response) => {
  try {
    const { question, options, fingerprint } = req.body;

    // ---- validation ----
    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' });
      return;
    }

    if (!Array.isArray(options) || options.length < 2) {
      res.status(400).json({ error: 'At least 2 options are required' });
      return;
    }

    if (options.length > 10) {
      res.status(400).json({ error: 'Maximum 10 options allowed' });
      return;
    }

    const cleanQuestion = sanitizeText(question, 500);
    if (cleanQuestion.length === 0) {
      res.status(400).json({ error: 'Question cannot be empty after sanitization' });
      return;
    }

    const cleanOptions = options
      .map((opt: unknown) => sanitizeText(String(opt || ''), 200))
      .filter((opt: string) => opt.length > 0);

    if (cleanOptions.length < 2) {
      res.status(400).json({ error: 'At least 2 non-empty options are required' });
      return;
    }

    // check for duplicate options
    const uniqueOptions = [...new Set(cleanOptions.map((o: string) => o.toLowerCase()))];
    if (uniqueOptions.length !== cleanOptions.length) {
      res.status(400).json({ error: 'Duplicate options are not allowed' });
      return;
    }

    // ---- create poll ----
    const shareCode = generateShareCode(8);
    const hashedFp = fingerprint ? hashFingerprint(fingerprint) : null;

    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert({
        question: cleanQuestion,
        share_code: shareCode,
        creator_fingerprint: hashedFp,
      })
      .select('id, share_code, created_at')
      .single();

    if (pollError || !poll) {
      console.error('Failed to create poll:', pollError);
      res.status(500).json({ error: 'Failed to create poll' });
      return;
    }

    // ---- insert options ----
    const optionRows = cleanOptions.map((label: string, idx: number) => ({
      poll_id: poll.id,
      label,
      position: idx,
    }));

    const { error: optError } = await supabase
      .from('poll_options')
      .insert(optionRows);

    if (optError) {
      console.error('Failed to insert options:', optError);
      // rollback poll
      await supabase.from('polls').delete().eq('id', poll.id);
      res.status(500).json({ error: 'Failed to create poll options' });
      return;
    }

    res.status(201).json({
      pollId: poll.id,
      shareCode: poll.share_code,
      createdAt: poll.created_at,
    });
  } catch (err) {
    console.error('POST /api/polls error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
 GET /api/polls/:shareCode
 Fetches a poll by its share code, including options and vote counts.
*/
router.get('/:shareCode', async (req: Request, res: Response) => {
  try {
    const { shareCode } = req.params;
    const voterFingerprint = req.query.fingerprint as string | undefined;

    // fetch the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, question, share_code, created_at, is_active')
      .eq('share_code', shareCode)
      .single();

    if (pollError || !poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    // fetch options
    const { data: options, error: optError } = await supabase
      .from('poll_options')
      .select('id, label, position')
      .eq('poll_id', poll.id)
      .order('position', { ascending: true });

    if (optError || !options) {
      res.status(500).json({ error: 'Failed to fetch options' });
      return;
    }

    // try redis cache for vote counts first
    let voteCounts: Record<string, number> = {};
    let cacheHit = false;

    try {
      const redis = await getRedisClient();
      const cached = await redis.get(`poll_votes:${poll.id}`);
      if (cached) {
        voteCounts = JSON.parse(cached);
        cacheHit = true;
      }
    } catch (_) {
      // redis miss, fall through to DB
    }

    if (!cacheHit) {
      // count votes per option from DB
      const { data: votes, error: voteError } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', poll.id);

      if (!voteError && votes) {
        for (const vote of votes) {
          voteCounts[vote.option_id] = (voteCounts[vote.option_id] || 0) + 1;
        }
      }

      // cache in redis for 10 seconds
      try {
        const redis = await getRedisClient();
        await redis.set(`poll_votes:${poll.id}`, JSON.stringify(voteCounts), { EX: 10 });
      } catch (_) {
        // fail silently
      }
    }

    // check if this voter already voted
    let hasVoted = false;
    if (voterFingerprint) {
      const hashed = hashFingerprint(voterFingerprint);
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('voter_fingerprint', hashed)
        .limit(1);

      hasVoted = (existingVote && existingVote.length > 0) || false;
    }

    const totalVotes = Object.values(voteCounts).reduce((sum, c) => sum + c, 0);

    const enrichedOptions = options.map((opt) => ({
      id: opt.id,
      label: opt.label,
      position: opt.position,
      voteCount: voteCounts[opt.id] || 0,
    }));

    res.json({
      poll: {
        id: poll.id,
        question: poll.question,
        shareCode: poll.share_code,
        createdAt: poll.created_at,
        isActive: poll.is_active,
      },
      options: enrichedOptions,
      totalVotes,
      hasVoted,
    });
  } catch (err) {
    console.error('GET /api/polls/:shareCode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
 POST /api/polls/:shareCode/vote
 Body: { optionId: string, fingerprint: string }
 Casts a vote on a poll option.
*/
router.post('/:shareCode/vote', async (req: Request, res: Response) => {
  try {
    const { shareCode } = req.params;
    const { optionId, fingerprint } = req.body;

    if (!optionId || !fingerprint) {
      res.status(400).json({ error: 'optionId and fingerprint are required' });
      return;
    }

    const voterIp = req.ip || req.socket.remoteAddress || 'unknown';

    // fetch the poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('id, is_active')
      .eq('share_code', shareCode)
      .single();

    if (pollError || !poll) {
      res.status(404).json({ error: 'Poll not found' });
      return;
    }

    if (!poll.is_active) {
      res.status(403).json({ error: 'This poll is no longer accepting votes' });
      return;
    }

    // verify option belongs to this poll
    const { data: option, error: optError } = await supabase
      .from('poll_options')
      .select('id')
      .eq('id', optionId)
      .eq('poll_id', poll.id)
      .single();

    if (optError || !option) {
      res.status(400).json({ error: 'Invalid option for this poll' });
      return;
    }

    const hashedFp = hashFingerprint(fingerprint);

    // --- Anti-abuse check #2: IP-based Redis check ---
    const ipAlreadyVoted = await hasIpVoted(voterIp, poll.id);
    if (ipAlreadyVoted) {
      res.status(409).json({
        error: 'Already voted',
        message: 'A vote from your network has already been recorded for this poll.',
      });
      return;
    }

    // --- Insert vote (DB unique constraint is anti-abuse check #1) ---
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: poll.id,
        option_id: optionId,
        voter_fingerprint: hashedFp,
        voter_ip: voterIp,
      });

    if (voteError) {
      // unique constraint violation means duplicate vote
      if (voteError.code === '23505') {
        res.status(409).json({
          error: 'Already voted',
          message: 'You have already voted on this poll.',
        });
        return;
      }
      console.error('Vote insert error:', voteError);
      res.status(500).json({ error: 'Failed to record vote' });
      return;
    }

    // mark IP in redis
    await markIpVoted(voterIp, poll.id);

    // invalidate vote count cache
    try {
      const redis = await getRedisClient();
      await redis.del(`poll_votes:${poll.id}`);
    } catch (_) {
      // non-critical
    }

    // fetch fresh tallies to broadcast
    const { data: allVotes } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', poll.id);

    const tallies: Record<string, number> = {};
    if (allVotes) {
      for (const v of allVotes) {
        tallies[v.option_id] = (tallies[v.option_id] || 0) + 1;
      }
    }

    const totalVotes = Object.values(tallies).reduce((s, c) => s + c, 0);

    // broadcast to socket room
    if (io) {
      io.to(`poll:${shareCode}`).emit('vote-update', {
        tallies,
        totalVotes,
      });
    }

    // cache updated tallies
    try {
      const redis = await getRedisClient();
      await redis.set(`poll_votes:${poll.id}`, JSON.stringify(tallies), { EX: 10 });
    } catch (_) {
      // non-critical
    }

    res.status(200).json({
      success: true,
      tallies,
      totalVotes,
    });
  } catch (err) {
    console.error('POST /api/polls/:shareCode/vote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
