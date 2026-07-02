import { Request, Response, NextFunction } from 'express';
import { auth } from '../auth/index.js';
import { db } from '../db/index.js';
import { user } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role?: string | null;
        status?: string | null;
      };
      session?: any;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers as any,
    });

    if (!session || !session.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userData.length) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = userData[0];
    req.session = session.session;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireRole = (roles: ('sales' | 'manager' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userRole = req.user.role as 'sales' | 'manager' | 'admin';

    // Admin can access everything
    if (userRole === 'admin') {
      return next();
    }

    // Manager can access manager and sales routes
    if (userRole === 'manager' && (roles.includes('manager') || roles.includes('sales'))) {
      return next();
    }

    // Exact role match
    if (roles.includes(userRole)) {
      return next();
    }

    res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
  };
};
