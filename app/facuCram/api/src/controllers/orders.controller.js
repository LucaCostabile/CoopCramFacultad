import { prisma } from '../config/prisma.js';

export async function createOrder(req, res, next) {
  try {
    const { items, comment } = req.body || {};
    if (!Array.isArray(items) || items.length < 1) {
      return res.status(422).json({ error: 'items requerido (array con al menos 1 ítem)' });
    }
    for (const it of items) {
      if (!it?.code || !Number.isInteger(it?.quantity) || it.quantity < 1) {
        return res.status(422).json({ error: 'Cada item requiere code y quantity >= 1' });
      }
    }

    // Obtener productos por code
    const codes = items.map(i => i.code);
    const products = await prisma.products.findMany({ where: { code: { in: codes }, is_active: true } });
    const map = new Map(products.map(p => [p.code, p]));

    // Calcular totales
    let total = 0;
    const orderItemsData = [];
    for (const it of items) {
      const p = map.get(it.code);
      if (!p) return res.status(422).json({ error: `Producto no encontrado o inactivo: ${it.code}` });
      const unit = Number(p.price);
      const qty = Number(it.quantity);
      const subtotal = unit * qty;
      total += subtotal;
      orderItemsData.push({ product_code: p.code, quantity: qty, unit_price: unit, subtotal });
    }

    const created = await prisma.$transaction(async (tx) => {
      const userId = req.user?.id || null;
      const order = await tx.orders.create({ data: { user_id: userId, status: 'pending', total, comment: comment || null } });
      for (const oi of orderItemsData) {
        await tx.order_items.create({ data: { ...oi, order_id: order.id } });
      }
      return order;
    });

    res.json({ ok: true, order_id: created.id });
  } catch (err) {
    next(err);
  }
}
