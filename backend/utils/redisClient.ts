import logger from './logger.js';
import { createClient } from 'redis';
import { getRedisUrl } from '@/config/env.js';

const redisClient = createClient({
  url: getRedisUrl(),
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
