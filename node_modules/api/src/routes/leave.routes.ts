import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { LeaveService } from '../services/leave.service';
import { upload, generateFilename } from '../middleware/upload';
import { storage } from '../lib/storage';

const router = Router();

router.post(
  '/',
  requireAuth,
  upload.single('attachment'),
  async (req, res) => {
    try {
      const { type, startDate, endDate, reason } = req.body;
      let attachmentUrl = undefined;

      if (req.file) {
        const filename = generateFilename(req.file.originalname);
        attachmentUrl = await storage.save(req.file.buffer, filename, req.file.mimetype);
      }

      const record = await LeaveService.submit(req.user!.id, {
        type,
        startDate,
        endDate,
        reason,
        attachmentUrl,
      });
      res.json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to submit leave request' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  try {
    const records = await LeaveService.getMe(req.user!.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave history' });
  }
});

// Manager routes
router.get('/pending', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const records = await LeaveService.getPending();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

router.get('/pending/count', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const count = await LeaveService.getPendingCount();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending count' });
  }
});

router.get('/all', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const records = await LeaveService.getAll();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all leaves' });
  }
});

router.patch('/:id/approve', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const record = await LeaveService.updateStatus(req.params.id as string, 'approved', req.user!.id);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

router.patch('/:id/reject', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const record = await LeaveService.updateStatus(req.params.id as string, 'rejected', req.user!.id);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

export default router;
