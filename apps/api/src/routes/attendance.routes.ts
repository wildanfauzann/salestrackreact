import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { AttendanceService } from '../services/attendance.service.js';
import { upload, generateFilename } from '../middleware/upload.js';
import { storage } from '../lib/storage.js';

const router = Router();

router.post(
  '/check-in',
  requireAuth,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      let photoUrl = undefined;

      if (req.file) {
        const filename = generateFilename(req.file.originalname);
        photoUrl = await storage.save(req.file.buffer, filename, req.file.mimetype);
      }

      const record = await AttendanceService.checkIn(
        req.user!.id,
        parseFloat(latitude),
        parseFloat(longitude),
        photoUrl
      );
      res.json(record);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes('Check-in hanya dapat dilakukan')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to check in' });
      }
    }
  }
);

router.post('/check-out', requireAuth, async (req, res) => {
  try {
    const record = await AttendanceService.checkOut(req.user!.id);
    res.json(record);
  } catch (error: any) {
    if (error.message === 'Belum waktunya check-out') {
      res.status(400).json({ error: 'Check-out hanya dapat dilakukan setelah jam 17:00.' });
    } else {
      res.status(500).json({ error: 'Failed to check out' });
    }
  }
});

router.get('/today', requireAuth, async (req, res) => {
  try {
    const record = await AttendanceService.getToday(req.user!.id);
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today status' });
  }
});

router.get('/history', requireAuth, async (req, res) => {
  try {
    const records = await AttendanceService.getHistory(req.user!.id);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Manager routes
router.get('/team', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    // For v1, team = all team today
    const records = await AttendanceService.getTeamToday();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team attendance' });
  }
});

router.get('/team/today', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const records = await AttendanceService.getTeamToday();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team today' });
  }
});

export default router;
