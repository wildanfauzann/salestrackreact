import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { CustomerService } from '../services/customer.service';
const router = Router();
router.get('/', requireAuth, async (req, res) => {
    try {
        const customers = await CustomerService.getAll();
        res.json(customers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});
router.post('/', requireAuth, async (req, res) => {
    try {
        const record = await CustomerService.create(req.user.id, req.body);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
});
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const record = await CustomerService.getById(req.params.id);
        if (!record) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});
router.patch('/:id', requireAuth, async (req, res) => {
    try {
        const record = await CustomerService.update(req.params.id, req.body);
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update customer' });
    }
});
export default router;
