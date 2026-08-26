import logger from '../utils/logger.js';
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
  url:
    process.env.REDIS_URL ||
    (process.env.DB_HOST === 'db' ? 'redis://redis:6379' : 'redis://127.0.0.1:6379'),
});

redisClient.on('error', (err) => logger.info('Redis Client Error', err));

let isConnected = false;

export const connectRedis = async () => {
  if (!isConnected) {
    await redisClient.connect();
    isConnected = true;
    logger.info('Connected to Redis');
  }
};

export default redisClient;
