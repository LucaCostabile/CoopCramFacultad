import { Router } from 'express';
import authRoutes from './auth.routes.js';
import newsRoutes from './news.routes.js';
import catalogRoutes from './catalog.routes.js';
import ordersRoutes from './orders.routes.js';
import usersRoutes from './users.routes.js';
import accountRoutes from './account.routes.js';
import salesRoutes from './sales.routes.js';
import { prisma } from '../config/prisma.js';

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		res.json({ ok: true, service: 'facuCram-api', db: 'ok' });
	} catch (e) {
		res.status(500).json({ ok: false, service: 'facuCram-api', db: 'error', error: String(e?.message || e) });
	}
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/news', newsRoutes);
apiRouter.use('/catalogo', catalogRoutes);
apiRouter.use('/pedidos', ordersRoutes);
apiRouter.use('/usuarios', usersRoutes);
apiRouter.use('/account', accountRoutes);
apiRouter.use('/sales', salesRoutes);
