import { Router } from 'express';
import { register, login, staffLogin, refreshToken, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/staff-login', staffLogin);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);

export default router;
