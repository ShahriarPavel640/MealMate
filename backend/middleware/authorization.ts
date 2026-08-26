import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authorization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. No token provided.' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = (payload as any).user || payload;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
export default authorization;
