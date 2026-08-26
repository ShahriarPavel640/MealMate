import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodIssue } from 'zod';

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.issues.map((issue: ZodIssue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    next(err);
  }
};
