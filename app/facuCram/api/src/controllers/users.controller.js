import { prisma } from '../config/prisma.js';
import { normalizeId, detectRoleFromId } from '../utils/userId.js';

export async function listUsers(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '20', 10), 1), 200);
    const search = (req.query.search || '').trim();
    const where = search
      ? {
          OR: [
            { id: { contains: search } },
            { name: { contains: search } },
            { role: { contains: search } },
          ],
        }
      : {};
    const [total, items] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, name: true, role: true, email: true, phone: true, is_disabled: true, created_at: true },
      }),
    ]);
    res.json({ page, pageSize, total, items });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const id = String(req.params.id);
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const rawId = req.body.id;
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase() || null;
    const phone = (req.body.phone || '').trim() || null;
    if (!rawId) return res.status(400).json({ error: 'id requerido' });
    const id = normalizeId(rawId);
    const role = req.body.role || detectRoleFromId(id);
    const now = new Date();
    const user = await prisma.users.create({
      data: { id, name, role, email, phone, created_at: now, updated_at: now },
      select: { id: true, name: true, role: true, email: true, phone: true, is_disabled: true, created_at: true }
    });
    res.status(201).json(user);
  } catch (err) {
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese id/email/phone' });
    }
    next(err);
  }
}

export async function updateUser(req, res, next) {
  try {
    const id = String(req.params.id);
    const data = {};
    if (typeof req.body.name === 'string') data.name = req.body.name.trim();
    if (typeof req.body.role === 'string') data.role = req.body.role.trim();
    if (typeof req.body.email === 'string') data.email = req.body.email.trim().toLowerCase();
    if (typeof req.body.phone === 'string') data.phone = req.body.phone.trim();
    if (typeof req.body.is_disabled === 'boolean') data.is_disabled = req.body.is_disabled;
    data.updated_at = new Date();
    const user = await prisma.users.update({
      where: { id },
      data,
      select: { id: true, name: true, role: true, email: true, phone: true, is_disabled: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Email o teléfono ya existe' });
    next(err);
  }
}

export async function toggleDisable(req, res, next) {
  try {
    const id = String(req.params.id);
    const { is_disabled } = req.body;
    if (typeof is_disabled !== 'boolean') return res.status(400).json({ error: 'is_disabled debe ser boolean' });
    const user = await prisma.users.update({
      where: { id },
      data: { is_disabled, updated_at: new Date() },
      select: { id: true, name: true, role: true, email: true, phone: true, is_disabled: true, created_at: true }
    });
    res.json(user);
  } catch (err) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' });
    next(err);
  }
}
