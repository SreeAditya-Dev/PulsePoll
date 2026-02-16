import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: RedisClientType;
let isConnected = false;

export async function getRedisClient(): Promise<RedisClientType> {
  if (isConnected && redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD || '',
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          console.error('Redis: too many reconnect attempts, giving up');
          return new Error('Redis reconnect limit reached');
        }
        return Math.min(retries * 200, 3000);
      },
    },
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    console.error('Redis client error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
    isConnected = true;
  });

  redisClient.on('end', () => {
    console.log('Redis disconnected');
    isConnected = false;
  });

  await redisClient.connect();
  return redisClient;
}
