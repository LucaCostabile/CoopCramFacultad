import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRouter } from './routes/index.js';
import { loadEnv } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';

loadEnv();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Asegura que BigInt/Decimal no rompan JSON.stringify
app.set('json replacer', (_key, value) => {
	if (typeof value === 'bigint') return Number(value);
	if (value && typeof value === 'object' && 'd' in value && 'e' in value && 's' in value) {
		// Prisma Decimal
		return parseFloat(value.toString());
	}
	return value;
});

const base = process.env.API_BASE || '/api';
app.use(base, apiRouter);

// Static storage for uploaded images (news, etc.)
const storageDir = path.join(process.cwd(), 'storage');
app.use('/storage', express.static(storageDir));

// Health root
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use(errorHandler);

export default app;
