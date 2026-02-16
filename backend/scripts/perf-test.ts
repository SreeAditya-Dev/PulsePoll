
import { io } from 'socket.io-client';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:4000';
const API_URL = `${BASE_URL}/api`;

async function measureApiLatency() {
  console.log('\n--- API Latency Test ---');
  const measures: number[] = [];
  
  // Warmup
  try { await fetch(`${BASE_URL}/health`); } catch {}

  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${BASE_URL}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await res.json(); 
      const end = performance.now();
      measures.push(end - start);
    } catch (err) {
      console.error(`Request ${i + 1} failed:`, err);
    }
  }

  if (measures.length === 0) return 0;
  const avg = measures.reduce((a, b) => a + b, 0) / measures.length;
  console.log(`API Health Check RTT (avg of 10): ${avg.toFixed(2)} ms`);
  return avg;
}

async function measureSocketLatency() {
  console.log('\n--- WebSocket Performance Test ---');
  
  // 1. Measure Handshake
  let handshakeSum = 0;
  const iterations = 5;

  for(let i=0; i<iterations; i++) {
    await new Promise<void>(resolve => {
        const start = performance.now();
        const socket = io(BASE_URL, { transports: ['websocket'], forceNew: true });
        socket.on('connect', () => {
            const end = performance.now();
            handshakeSum += (end - start);
            socket.disconnect();
            resolve();
        });
    });
  }
  console.log(`Socket Handshake Time (avg of ${iterations}): ${(handshakeSum/iterations).toFixed(2)} ms`);

  // 2. Measure Join Latency
  const shareCode = await createPoll();
  if (!shareCode) return;

  console.log(`Testing Join Latency with Poll: ${shareCode}`);
  
  // Create a persistent connection for join tests
  const socket = io(BASE_URL, { transports: ['websocket'] });
  
  await new Promise<void>(resolve => socket.on('connect', resolve));

  let joinSum = 0;
  const joinIterations = 5;

  for(let i=0; i<joinIterations; i++) {
    await new Promise<void>(resolve => {
        const start = performance.now();
        socket.emit('join-poll', shareCode);
        socket.once('poll-state', () => {
            const end = performance.now();
            joinSum += (end - start);
            // Leave so we can join again clearly? 
            // Actually re-joining is fine, but let's be clean
            socket.emit('leave-poll', shareCode);
            setTimeout(resolve, 50); // small buffer
        });
    });
  }

  console.log(`Join -> Receive State Latency (avg of ${joinIterations}): ${(joinSum/joinIterations).toFixed(2)} ms`);
  socket.disconnect();
}

async function createPoll() {
    try {
        const res = await fetch(`${API_URL}/polls`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: 'Perf Test Poll',
                options: ['A', 'B']
            })
        });
        const data = await res.json() as any;
        return data.shareCode;
    } catch (e) {
        console.error('Failed to create poll for test:', e);
        return null;
    }
}

async function run() {
  console.log('Starting Performance Benchmark...');
  console.log('Target:', BASE_URL);
  
  await measureApiLatency();
  await measureSocketLatency();
  
  console.log('\n--- Benchmark Complete ---');
}

run();
