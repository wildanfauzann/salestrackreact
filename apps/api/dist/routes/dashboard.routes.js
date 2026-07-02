import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { DashboardService } from '../services/dashboard.service';
const router = Router();
router.get('/sales', requireAuth, async (req, res) => {
    try {
        const data = await DashboardService.getSalesDashboard(req.user.id);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sales dashboard data' });
    }
});
// Manager routes
router.get('/manager', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const { month, year, period } = req.query;
        const data = await DashboardService.getManagerDashboard(month ? Number(month) : undefined, year ? Number(year) : undefined, period);
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch manager dashboard data' });
    }
});
export default router;
