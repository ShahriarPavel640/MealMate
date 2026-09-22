import { Request, Response, NextFunction } from 'express';
const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    if (!req.user!.role || !allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};
export default authorizeRoles;
