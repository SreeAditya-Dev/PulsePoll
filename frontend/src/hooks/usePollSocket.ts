import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Fallback to Render URL if env var is missing (vital for Vercel deployment)
const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || 'https://pulsepoll.onrender.com').replace(/\/$/, '');

interface UsePollSocketProps {
  shareCode: string | undefined;
}

interface UsePollSocketReturn {
  isConnected: boolean;
  tallies: Record<string, number>;
  totalVotes: number;
  viewerCount: number;
  isActive: boolean;
  error: string | null;
}

export function usePollSocket({ shareCode }: UsePollSocketProps): UsePollSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [tallies, setTallies] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!shareCode) return;

    // Initialize socket connection
    // We use a single socket connection per client to minimize overhead.
    // Transports are forced to websocket first for performance, with polling fallback.
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    /**
     * Connection Logic:
     * 1. Connect to the server.
     * 2. Immediately join the specific poll room (shareCode).
     * 3. Listen for state updates broadcasted to that room.
     */

    socket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setError(null);
      // Join the poll room
      socket.emit('join-poll', shareCode);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Connection failed. Retrying...');
      setIsConnected(false);
    });

    // Initial state from server
    socket.on('poll-state', (data: any) => {
      setTallies(data.tallies || {});
      setTotalVotes(data.totalVotes || 0);
      setViewerCount(data.viewerCount || 0);
      setIsActive(data.isActive ?? true);
    });

    // Live updates
    socket.on('vote-update', (data: any) => {
      setTallies(data.tallies || {});
      setTotalVotes(data.totalVotes || 0);
    });

    socket.on('viewer-count', (data: any) => {
      setViewerCount(data.viewerCount || 0);
    });

    socket.on('error', (data: any) => {
      setError(data.message || 'An error occurred');
    });

    return () => {
      if (shareCode) {
        socket.emit('leave-poll', shareCode);
      }
      socket.disconnect();
    };
  }, [shareCode]);

  return { isConnected, tallies, totalVotes, viewerCount, isActive, error };
}
