import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { getAccount, updateAccount, myOrders, orderItems } from '../controllers/account.controller.js';

const router = Router();

router.get('/', requireAuth, getAccount);
router.patch('/', requireAuth, updateAccount);
router.get('/orders', requireAuth, myOrders);
router.get('/orders/:id/items', requireAuth, orderItems);

export default router;
