import { Request, Response, NextFunction } from 'express';
export const validate = (schema: any) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.issues.map((issue: any) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    next(err);
  }
};
