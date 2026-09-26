import { Router } from 'express';
import { getDashboardSummary } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/dashboard', authenticate, getDashboardSummary);

export default router;
