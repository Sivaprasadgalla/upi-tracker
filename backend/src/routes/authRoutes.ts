import { Router } from 'express';
import { register, login, getProfile, updateNotificationSettings, getOrCreateDefaultSession } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/session', getOrCreateDefaultSession);
router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.patch('/notification-settings', authenticate, updateNotificationSettings);

export default router;
