import { prisma } from '../config/prisma.js';

export async function getAccount(req, res, next) {
  try {
    const id = req.user?.id;
    const user = await prisma.users.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, email: true, phone: true, email_pending: true }
    });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) { next(err); }
}

export async function updateAccount(req, res, next) {
  try {
    const id = req.user?.id;
    const { email, phone } = req.body || {};

    // Validaciones básicas
    if (email && typeof email !== 'string') return res.status(422).json({ error: 'Email inválido' });
    if (phone && typeof phone !== 'string') return res.status(422).json({ error: 'Teléfono inválido' });

    // Chequear unicidad (ignorando el propio usuario)
    if (email) {
      const exists = await prisma.users.findFirst({ where: { email, id: { not: id } }, select: { id: true } });
      if (exists) return res.status(422).json({ error: 'Ese email ya está en uso' });
    }
    if (phone) {
      const exists = await prisma.users.findFirst({ where: { phone, id: { not: id } }, select: { id: true } });
      if (exists) return res.status(422).json({ error: 'Ese teléfono ya está en uso' });
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { email: email ?? null, phone: phone ?? null, updated_at: new Date() },
      select: { id: true, name: true, role: true, email: true, phone: true, email_pending: true }
    });
    res.json(updated);
  } catch (err) { next(err); }
}

export async function myOrders(req, res, next) {
  try {
    const userId = req.user?.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(20, Math.max(5, parseInt(req.query.per || '10', 10)));
    const skip = (page - 1) * perPage;

    const [total, orders] = await Promise.all([
      prisma.orders.count({ where: { user_id: userId } }),
      prisma.orders.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        select: { id: true, created_at: true, total: true, status: true },
        skip, take: perPage
      })
    ]);

    // Obtener items_count por cada order
    const counts = await Promise.all(
      orders.map(o => prisma.order_items.count({ where: { order_id: o.id } }))
    );
    const data = orders.map((o, idx) => ({ ...o, items_count: counts[idx] }));

    res.json({
      data,
      total,
      current_page: page,
      per_page: perPage,
      last_page: Math.max(1, Math.ceil(total / perPage))
    });
  } catch (err) { next(err); }
}

export async function orderItems(req, res, next) {
  try {
    const userId = req.user?.id;
    const id = parseInt(req.params.id, 10);
    const order = await prisma.orders.findFirst({ where: { id, user_id: userId } });
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    const items = await prisma.order_items.findMany({
      where: { order_id: id },
      select: { id: true, product_code: true, quantity: true, unit_price: true, subtotal: true }
    });

    const codes = items.map(i => i.product_code).filter(Boolean);
    const products = codes.length
      ? await prisma.products.findMany({ where: { code: { in: codes } }, select: { code: true, articulo: true, info_tecnica: true } })
      : [];
    const map = new Map(products.map(p => [p.code, p]));

    const result = items.map(it => {
      const p = it.product_code ? map.get(it.product_code) : null;
      return {
        id: it.id,
        product_code: it.product_code,
        name: p?.articulo ?? null,
        info_tecnica: p?.info_tecnica ?? null,
        quantity: it.quantity,
        price: Number(it.unit_price),
        subtotal: Number(it.subtotal)
      };
    });

    res.json(result);
  } catch (err) { next(err); }
}
