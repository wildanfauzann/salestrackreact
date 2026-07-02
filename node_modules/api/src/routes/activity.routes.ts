import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { ActivityService } from '../services/activity.service';
import { upload, generateFilename } from '../middleware/upload';
import { storage } from '../lib/storage';

const router = Router();

router.post(
  '/',
  requireAuth,
  upload.array('attachments', 5), // allow up to 5 files
  async (req, res) => {
    try {
      const {
        customerName,
        type,
        summary,
        notes,
        activityDate,
      } = req.body;
      
      const attachmentUrls: string[] = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const filename = generateFilename(file.originalname);
          const url = await storage.save(file.buffer, filename, file.mimetype);
          attachmentUrls.push(url);
        }
      }

      const record = await ActivityService.create(req.user!.id, {
        customerName,
        type,
        summary,
        notes,
        attachmentUrls,
        activityDate: new Date(activityDate || Date.now()),
      });
      res.json(record);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create activity' });
    }
  }
);

router.get('/me', requireAuth, async (req, res) => {
  try {
    const records = await ActivityService.getMe(req.user!.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity history' });
  }
});

router.get('/today', requireAuth, async (req, res) => {
  try {
    const records = await ActivityService.getToday(req.user!.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today activities' });
  }
});

// Manager routes
router.get('/team', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const records = await ActivityService.getTeam();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team activities' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const record = await ActivityService.getById(req.params.id as string);
    if (!record) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

export default router;
