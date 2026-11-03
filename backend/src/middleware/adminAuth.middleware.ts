import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedAdminRequest extends Request {
  adminId?: string;
}

interface JwtAdminPayload {
  adminId?: string;
  role?: string;
  userId?: string;
}

export const adminAuthMiddleware = (req: AuthenticatedAdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtAdminPayload;

    if (decoded.role !== 'admin' || !decoded.adminId) {
      res.status(403).json({ error: 'Forbidden: Admin access required' });
      return;
    }

    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
};
