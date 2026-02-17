import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';
import pollRoutes, { setSocketIO } from './routes/polls';
import { setupPollSockets } from './socket/pollRooms';
import { getRedisClient } from './config/redis';
import { createRateLimiter } from './middleware/rateLimit';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);

// socket.io setup
const io = new SocketServer(server, {
  cors: {
    origin: (_origin, callback) => callback(null, true),
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// trust proxy for correct IP detection behind reverse proxies
app.set('trust proxy', 1);

// global rate limiter: 60 requests per minute per IP
const globalLimiter = createRateLimiter({
  windowMs: 60000,
  maxRequests: 60,
  keyPrefix: 'rl_global',
});
app.use('/api', globalLimiter);

// mount routes
// mount routes
setSocketIO(io);
app.use('/api/v1/polls', pollRoutes);

// standard health check response
const getHealthStatus = () => ({
  status: 'ok',
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
});

// health check
app.get('/health', (_req, res) => {
  res.json(getHealthStatus());
});

// API-prefixed health check for test suite and clients using /api/v1
app.get('/api/v1/health', (_req, res) => {
  res.json(getHealthStatus());
});
// setup socket handlers
setupPollSockets(io);

// start server
async function start() {
  // warm up redis connection
  try {
    await getRedisClient();
    console.log('Redis connection established');
  } catch (err) {
    console.warn('Redis connection failed, running without cache:', err);
  }

  server.listen(PORT, () => {
    console.log(`PulsePoll server running on port ${PORT}`);
    console.log(`Accepting connections from ${CLIENT_URL}`);
  });
}

start();
