import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authGuard } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);

router.post('/login', login);

router.get('/me', authGuard, getCurrentUser);

export default router;