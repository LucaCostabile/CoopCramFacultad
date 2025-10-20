import { Router } from 'express';
import { getProducts, getFilters, getRubroCounts } from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', getProducts); // GET /api/catalogo
router.get('/filters', getFilters); // GET /api/catalogo/filters
router.get('/rubro-counts', getRubroCounts); // GET /api/catalogo/rubro-counts

export default router;
