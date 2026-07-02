import { auth } from '../auth';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
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
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const userRole = req.user.role;
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
