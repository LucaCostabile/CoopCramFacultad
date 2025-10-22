import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, toggleDisable } from '../controllers/users.controller.js';
import { requireAuth, requireRoles } from '../middlewares/auth.js';

const router = Router();

// Solo administradores y soporte
router.use(requireAuth, requireRoles(['administrador','soporte']));
router.get('/', listUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/:id/disable', toggleDisable);

export default router;
