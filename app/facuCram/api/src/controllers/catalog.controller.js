import { prisma } from '../config/prisma.js';
import { paginate } from '../utils/pagination.js';

export async function getProducts(req, res, next) {
  try {
    const q = (req.query.q || '').toString().trim();
    const only_stock = ['1', 'true', 'on'].includes((req.query.only_stock || '').toString());
    const motor = (req.query.motor || '').toString().trim();
    const rubro = (req.query.rubro || '').toString().trim();
    const per_page = Math.max(10, Math.min(parseInt(req.query.per_page || '50', 10), 100));
    const page = Math.max(1, parseInt(req.query.page || '1', 10));

    // Filtros
    const where = { is_active: true };
    if (only_stock) where.in_stock = true;
    if (motor) where.motor = motor;
    if (rubro) where.rubro = rubro;

    // Búsqueda por palabras: construir OR de palabras sobre varios campos
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      where.AND = words.map(w => ({
        OR: [
          { articulo: { contains: w } },
          { rubro: { contains: w } },
          { motor: { contains: w } },
          { code: { contains: w } },
          { nro_fabrica: { contains: w } },
          { info_tecnica: { contains: w } },
          { mv: { contains: w } },
        ]
      }));
    }

    const total = await prisma.products.count({ where });
    const data = await prisma.products.findMany({
      where,
      orderBy: [{ articulo: 'asc' }, { rubro: 'asc' }],
      skip: (page - 1) * per_page,
      take: per_page,
    });
    res.json(paginate(data, page, per_page, total));
  } catch (err) {
    next(err);
  }
}

export async function getFilters(_req, res, next) {
  try {
    const motorsRows = await prisma.products.findMany({
      where: { motor: { not: null }, is_active: true },
      distinct: ['motor'],
      orderBy: { motor: 'asc' },
      select: { motor: true },
    });
    const rubrosRows = await prisma.products.findMany({
      where: { rubro: { not: null }, is_active: true },
      distinct: ['rubro'],
      orderBy: { rubro: 'asc' },
      select: { rubro: true },
    });
    const motors = motorsRows.map(r => r.motor).filter(Boolean);
    const rubros = rubrosRows.map(r => r.rubro).filter(Boolean);
    res.json({ motors, rubros });
  } catch (err) {
    next(err);
  }
}

export async function getRubroCounts(req, res, next) {
  try {
    // reutilizar filtros básicos
    const q = (req.query.q || '').toString().trim();
    const only_stock = ['1', 'true', 'on'].includes((req.query.only_stock || '').toString());
    const motor = (req.query.motor || '').toString().trim();

    const where = { is_active: true };
    if (only_stock) where.in_stock = true;
    if (motor) where.motor = motor;
    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      where.AND = words.map(w => ({
        OR: [
          { articulo: { contains: w } },
          { rubro: { contains: w } },
          { motor: { contains: w } },
          { code: { contains: w } },
          { nro_fabrica: { contains: w } },
          { info_tecnica: { contains: w } },
          { mv: { contains: w } },
        ]
      }));
    }
    const rows = await prisma.products.groupBy({
      by: ['rubro'],
      where: { ...where, rubro: { not: null } },
      _count: { _all: true },
    });
    const sorted = rows
      .filter(r => r.rubro)
      .sort((a,b)=> (a.rubro||'').localeCompare(b.rubro||''))
      .map(r => ({ rubro: r.rubro, total: r._count._all }));
    res.json(sorted);
  } catch (err) {
    next(err);
  }
}
