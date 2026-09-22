import logger from '@/utils/logger.js';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import redisClient from '@/utils/redisClient.js';
import { generateToken } from '@/utils/jwtGenerator.js';
import env from '@/config/env.js';

export const refreshToken = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as jwt.JwtPayload;
    const userId = (decoded as any).id;
    const role = (decoded as any).role;

    // Check if token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refreshToken) {
      return res.status(401).json({ message: 'Refresh token is invalid or expired.' });
    }

    // Issue new tokens (generateToken will overwrite the old ones in Redis and cookies)
    await generateToken(userId, role, res);

    return res.status(200).json({ message: 'Tokens refreshed successfully' });
  } catch (err) {
    logger.error('Refresh token error:', (err as Error).message);
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};
