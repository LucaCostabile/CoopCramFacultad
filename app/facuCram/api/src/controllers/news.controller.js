import { prisma } from '../config/prisma.js';

export async function listNews(_req, res, next) {
  try {
    const items = await prisma.news.findMany({
      where: { is_active: true },
      orderBy: [{ display_order: 'asc' }, { created_at: 'asc' }],
    });
    // MySQL suele ordenar NULLs primero; mover null al final para emular Laravel
    const sorted = items.sort((a, b) => {
      const ad = a.display_order ?? Infinity;
      const bd = b.display_order ?? Infinity;
      if (ad !== bd) return ad - bd;
      const ac = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bc = b.created_at ? new Date(b.created_at).getTime() : 0;
      return ac - bc;
    });
    res.json(sorted);
  } catch (err) {
    next(err);
  }
}
