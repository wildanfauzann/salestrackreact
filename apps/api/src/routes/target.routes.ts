import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { db } from '../db';
import { globalTarget } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Get global target for a specific month/year
router.get('/', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const m = Number(month);
    const y = Number(year);

    const target = await db
      .select()
      .from(globalTarget)
      .where(and(eq(globalTarget.month, m), eq(globalTarget.year, y)))
      .limit(1);

    res.json({
      targetAmount: target.length > 0 ? Number(target[0].targetAmount) : 0
    });
  } catch (error) {
    console.error('Error fetching target:', error);
    res.status(500).json({ error: 'Failed to fetch target' });
  }
});

// Upsert global target
router.post('/', requireAuth, requireRole(['manager']), async (req, res) => {
  try {
    const { month, year, targetAmount } = req.body;
    if (!month || !year) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingTarget = await db
      .select()
      .from(globalTarget)
      .where(and(eq(globalTarget.month, Number(month)), eq(globalTarget.year, Number(year))))
      .limit(1);

    if (existingTarget.length > 0) {
      // Update
      await db
        .update(globalTarget)
        .set({ targetAmount: String(targetAmount) })
        .where(eq(globalTarget.id, existingTarget[0].id));
    } else {
      // Insert
      await db
        .insert(globalTarget)
        .values({
          month: Number(month),
          year: Number(year),
          targetAmount: String(targetAmount),
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting target:', error);
    res.status(500).json({ error: 'Failed to set target' });
  }
});

export default router;
