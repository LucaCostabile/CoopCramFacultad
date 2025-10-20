import express from 'express';
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

const base = process.env.API_BASE || '/api';
app.use(base, apiRouter);

// Health root
app.get('/health', (_req, res) => res.json({ ok: true }));

// Error handler
app.use(errorHandler);

export default app;
