import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { UserService } from '../services/user.service.js';
import { upload, generateFilename } from '../middleware/upload.js';
import { storage } from '../lib/storage.js';

const router = Router();

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await UserService.getMe(req.user!.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/me', requireAuth, async (req, res) => {
  try {
    const { name, phone, image } = req.body;
    
    const payload: any = {};
    if (name !== undefined) payload.name = name;
    if (phone !== undefined) payload.phone = phone;
    if (image !== undefined) payload.image = image;

    const user = await UserService.updateMe(req.user!.id, payload);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.post('/me/photo', requireAuth, upload.single('photo'), async (req, res) => {
  try {
    let photoUrl = null;
    if (req.file) {
      const filename = generateFilename(req.file.originalname);
      photoUrl = await storage.save(req.file.buffer, filename, req.file.mimetype);
    }
    const user = await UserService.updateMe(req.user!.id, { image: photoUrl });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// Manager routes
router.get('/', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const user = await UserService.createUser(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const { role, name, email, phone, status, password } = req.body;
    const user = await UserService.updateUser(req.params.id as string, { role, name, email, phone, status, password });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const user = await UserService.deleteUser(req.params.id as string);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.patch('/:id/status', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await UserService.toggleStatus(req.params.id as string, status);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

export default router;
