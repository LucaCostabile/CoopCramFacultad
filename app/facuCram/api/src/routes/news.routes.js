import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { listNews, listAllNews, createNews, updateNews, deleteNews } from '../controllers/news.controller.js';
import { requireAuth, requireRoles } from '../middlewares/auth.js';

const router = Router();

router.get('/', listNews); // GET /api/news
router.get('/all', requireAuth, requireRoles(['administrador','admin_marketing']), listAllNews);

// Multer setup for image upload
const storageRoot = path.join(process.cwd(), 'storage', 'news');
if (!fs.existsSync(storageRoot)) fs.mkdirSync(storageRoot, { recursive: true });
const upload = multer({
	storage: multer.diskStorage({
		destination: (_req, _file, cb) => cb(null, storageRoot),
		filename: (_req, file, cb) => {
			const ext = path.extname(file.originalname) || '.jpg';
			const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
			cb(null, name);
		}
	}),
	limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

// Admin/marketing only
router.post('/', requireAuth, requireRoles(['administrador','admin_marketing']), upload.single('image'), createNews);
router.put('/:id', requireAuth, requireRoles(['administrador','admin_marketing']), upload.single('image'), updateNews);
router.delete('/:id', requireAuth, requireRoles(['administrador','admin_marketing']), deleteNews);

export default router;
