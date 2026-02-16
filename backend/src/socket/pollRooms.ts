import { Server as SocketServer, Socket } from 'socket.io';
import { supabase } from '../config/supabase';

/*
  Socket.IO room management for live poll updates.
  Each poll gets its own room named "poll:<shareCode>".
  When a client joins, we send them the current vote state.
*/

export function setupPollSockets(io: SocketServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-poll', async (shareCode: string) => {
      if (!shareCode || typeof shareCode !== 'string') {
        socket.emit('error', { message: 'Invalid share code' });
        return;
      }

      const roomName = `poll:${shareCode}`;
      socket.join(roomName);

      // fetch current state and send to joining client
      try {
        const { data: poll } = await supabase
          .from('polls')
          .select('id, question, is_active')
          .eq('share_code', shareCode)
          .single();

        if (!poll) {
          socket.emit('error', { message: 'Poll not found' });
          return;
        }

        const { data: votes } = await supabase
          .from('votes')
          .select('option_id')
          .eq('poll_id', poll.id);

        const tallies: Record<string, number> = {};
        if (votes) {
          for (const v of votes) {
            tallies[v.option_id] = (tallies[v.option_id] || 0) + 1;
          }
        }

        const totalVotes = Object.values(tallies).reduce((s, c) => s + c, 0);

        // count how many clients are in this room
        const roomSockets = io.sockets.adapter.rooms.get(roomName);
        const viewerCount = roomSockets ? roomSockets.size : 1;

        socket.emit('poll-state', {
          tallies,
          totalVotes,
          viewerCount,
          isActive: poll.is_active,
        });

        // let others know viewer count changed
        socket.to(roomName).emit('viewer-count', { viewerCount });
      } catch (err) {
        console.error('Error fetching poll state for socket:', err);
        socket.emit('error', { message: 'Failed to load poll data' });
      }
    });

    socket.on('leave-poll', (shareCode: string) => {
      const roomName = `poll:${shareCode}`;
      socket.leave(roomName);

      // update viewer count for remaining clients
      const roomSockets = io.sockets.adapter.rooms.get(roomName);
      const viewerCount = roomSockets ? roomSockets.size : 0;
      io.to(roomName).emit('viewer-count', { viewerCount });
    });

    socket.on('disconnecting', () => {
      // when a socket disconnects, update viewer counts in all rooms
      for (const room of socket.rooms) {
        if (room.startsWith('poll:')) {
          const roomSockets = io.sockets.adapter.rooms.get(room);
          // subtract 1 because this socket hasn't left yet
          const viewerCount = roomSockets ? Math.max(0, roomSockets.size - 1) : 0;
          socket.to(room).emit('viewer-count', { viewerCount });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
