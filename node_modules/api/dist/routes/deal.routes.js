import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { DealService } from '../services/deal.service';
const router = Router();
router.post('/', requireAuth, async (req, res) => {
    try {
        const { customerId, title, value, category, stage, priority, expectedCloseDate } = req.body;
        const record = await DealService.create(req.user.id, {
            customerId,
            title,
            value: parseFloat(value),
            category,
            stage: stage || 'prospek',
            priority,
            expectedCloseDate,
        });
        res.json(record);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create deal' });
    }
});
router.get('/me', requireAuth, async (req, res) => {
    try {
        const records = await DealService.getMe(req.user.id);
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const record = await DealService.update(req.params.id, req.body);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update deal' });
    }
});
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const record = await DealService.delete(req.params.id);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete deal' });
    }
});
router.patch('/:id/stage', requireAuth, async (req, res) => {
    try {
        const { stage } = req.body;
        const record = await DealService.updateStage(req.params.id, stage);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update deal stage' });
    }
});
router.get('/pipeline-summary', requireAuth, async (req, res) => {
    try {
        // Only fetch own summary for sales
        const summary = await DealService.getPipelineSummary(req.user.id);
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pipeline summary' });
    }
});
// Manager routes
router.get('/team', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const records = await DealService.getTeam();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch team deals' });
    }
});
router.get('/team/pipeline-summary', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const summary = await DealService.getPipelineSummary(); // No userId = all team
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch team pipeline summary' });
    }
});
router.get('/pending-approval', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const records = await DealService.getPendingApproval();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending approval deals' });
    }
});
router.get('/approval-history', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const records = await DealService.getApprovalHistory();
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch approval history' });
    }
});
router.get('/pending-approval/count', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const count = await DealService.getPendingApprovalCount();
        res.json({ count });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending approval count' });
    }
});
router.patch('/:id/approve', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const record = await DealService.updateApprovalStatus(req.params.id, 'approved', req.user.id);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to approve deal' });
    }
});
router.patch('/:id/reject', requireAuth, requireRole(['manager']), async (req, res) => {
    try {
        const record = await DealService.updateApprovalStatus(req.params.id, 'rejected', req.user.id);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reject deal' });
    }
});
export default router;
