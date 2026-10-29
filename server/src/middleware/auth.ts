import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store';
import { User } from '../types';

export const JWT_SECRET = process.env.JWT_SECRET || 'fieldtrack_development_secret_key_change_in_production';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    const user = store.getUserById(payload.id);
    if (!user) {
      res.status(401).json({ error: 'User associated with token not found' });
      return;
    }
    req.user = user;
    next();
  } catch (_err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
