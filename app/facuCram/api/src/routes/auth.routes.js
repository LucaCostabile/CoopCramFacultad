import { Router } from 'express';
import { login, me, setPassword } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/set-password', requireAuth, setPassword);
router.get('/me', requireAuth, me);

export default router;
