
const { createClient } = require('redis');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 4000;
const API_URL = `http://localhost:${PORT}/api/v1`;

async function main() {
  console.log('🚀 Starting Anti-Abuse Verification (JS)...');
  console.log(`Targeting: ${API_URL}`);

  try {
    // 1. Create Poll
    console.log('Creating poll...');
    const createRes = await fetch(`${API_URL}/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Test Poll for Anti-Abuse JS',
        options: ['Option A', 'Option B'],
        fingerprint: 'browser-fingerprint-1'
      })
    });

    if (!createRes.ok) {
      console.error('Failed to create poll:', await createRes.text());
      process.exit(1);
    }

    const { shareCode, pollId } = await createRes.json();
    console.log(`✅ Poll created: ${shareCode} (${pollId})`);

    // Fetch poll to get option IDs
    console.log('Fetching poll details...');
    const getRes = await fetch(`${API_URL}/polls/${shareCode}`);
    if (!getRes.ok) {
        console.error('Failed to fetch details:', await getRes.text());
        process.exit(1);
    }
    const pollData = await getRes.json();
    console.log('Poll details fetched.');
    const optionId = pollData.options[0].id;

    // 2. Vote 1 (User A)
    console.log('\n🗳️  Vote 1 (User A, IP ::1)...');
    const vote1 = await fetch(`${API_URL}/polls/${shareCode}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, fingerprint: 'user-a' })
    });

    if (vote1.status === 200) {
      console.log('✅ Vote 1 accepted');
    } else {
      console.error('❌ Vote 1 failed:', await vote1.text());
      process.exit(1);
    }

    // 3. Vote 2 (User B, same IP ::1) -> Should fail by IP check (Mechanism 2)
    console.log('\n🗳️  Vote 2 (User B, same IP)...');
    const vote2 = await fetch(`${API_URL}/polls/${shareCode}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, fingerprint: 'user-b' })
    });

    if (vote2.status === 409) {
      const json = await vote2.json();
      if (json.message && json.message.includes('from your network')) {
        console.log('✅ Vote 2 blocked by IP Rate Limit (Mechanism 2)');
      } else {
        console.warn('⚠️  Vote 2 blocked but unexpected message:', json.message);
      }
    } else {
      console.error('❌ Vote 2 status unexpected:', vote2.status, await vote2.text());
    }

    // 4. Clear Redis Key for IP
    console.log('\n🧹 Clearing Redis IP lock...');
    
    const redis = createClient({
      username: process.env.REDIS_USERNAME,
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
      }
    });
    
    redis.on('error', (err) => console.error('Redis Client Error', err));
    
    await redis.connect();
    
    const keys = [`vote_lock:::1:${pollId}`, `vote_lock:127.0.0.1:${pollId}`];
    for (const k of keys) {
      const del = await redis.del(k);
      if (del) console.log(`   Deleted key: ${k}`);
      else console.log(`   Key not found: ${k} (might be IPv6 vs IPv4 issue)`);
    }

    // 4b. Also scan for keys just in case IP format is different
    const scan = await redis.keys(`vote_lock:*:${pollId}`);
    if (scan.length > 0) {
        console.log('Found other keys:', scan);
        for(const k of scan) {
             await redis.del(k);
             console.log(`Deleted scanned key: ${k}`);
        }
    }

    await redis.disconnect();

    // 5. Vote 3 (User A, IP ::1) -> Should fail by DB unique constraint (Mechanism 1) because IP lock is gone but User A already voted
    console.log('\n🗳️  Vote 3 (User A again, IP lock cleared)...');
    const vote3 = await fetch(`${API_URL}/polls/${shareCode}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, fingerprint: 'user-a' })
    });

    if (vote3.status === 409) {
      const json = await vote3.json();
      if (json.message && json.message.includes('already voted')) {
        console.log('✅ Vote 3 blocked by DB Fingerprint Constraint (Mechanism 1)');
      } else {
        console.warn('⚠️  Vote 3 blocked but unexpected message:', json.message);
      }
    } else {
      console.error('❌ Vote 3 status unexpected:', vote3.status);
      console.log(await vote3.text());
    }

    // 6. Vote 4 (User B, IP ::1) -> Should SUCCEED now because IP lock cleared and User B hasn't voted in DB
    console.log('\n🗳️  Vote 4 (User B, IP lock cleared)...');
    const vote4 = await fetch(`${API_URL}/polls/${shareCode}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, fingerprint: 'user-b' })
    });

    if (vote4.status === 200) {
      console.log('✅ Vote 4 accepted (User B allowed after IP reset)');
    } else {
      console.error('❌ Vote 4 failed:', vote4.status, await vote4.text());
    }

    console.log('\n✨ Verification Complete!');
  } catch (err) {
    console.error('Unhandled error:', err);
  }
}

main();
