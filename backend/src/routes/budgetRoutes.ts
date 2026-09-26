import { Router } from 'express';
import {
  getBudgets,
  upsertBudget,
  deleteBudget,
  getNotifications,
  markNotificationsRead
} from '../controllers/budgetController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, getBudgets);
router.post('/limit', authenticate, upsertBudget);
router.delete('/:id', authenticate, deleteBudget);

router.get('/notifications', authenticate, getNotifications);
router.post('/notifications/mark-read', authenticate, markNotificationsRead);

export default router;
