import { prisma } from '../config/prisma.js';
import fs from 'fs';
import path from 'path';

function serializeNews(n) {
  if (!n) return null;
  return {
    id: Number(n.id),
    title: n.title,
    content: n.content,
    image: n.image ?? null,
    is_active: Boolean(n.is_active),
    display_order: typeof n.display_order === 'number' ? n.display_order : (n.display_order ?? null),
    created_at: n.created_at ? new Date(n.created_at).toISOString() : null,
    updated_at: n.updated_at ? new Date(n.updated_at).toISOString() : null,
  };
}

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
    res.json(sorted.map(serializeNews));
  } catch (err) {
    next(err);
  }
}

export async function listAllNews(_req, res, next) {
  try {
    const items = await prisma.news.findMany({ orderBy: [{ created_at: 'desc' }] });
    res.json(items.map(serializeNews));
  } catch (err) {
    next(err);
  }
}

export async function createNews(req, res, next) {
  try {
    const { title, content, is_active, display_order } = req.body || {};
    if (!title || !content) return res.status(422).json({ error: 'title y content son requeridos' });
    let imagePath = null;
    // Debug rápido para verificar recepción de archivo
    try { console.log('[news] createNews content-type:', req.headers['content-type']); } catch {}
    if (req.file) {
      try { console.log('[news] createNews file received:', req.file.originalname, '->', req.file.filename); } catch {}
      imagePath = path.join('news', req.file.filename).replace(/\\/g, '/');
    } else {
      try { console.log('[news] createNews NO file in request'); } catch {}
    }
    const created = await prisma.news.create({
      data: {
        title: String(title),
        content: String(content),
        image: imagePath,
        is_active: is_active === '1' || is_active === 1 || is_active === true,
        display_order: display_order ? Number(display_order) : null,
        created_at: new Date(),
        updated_at: new Date(),
      }
    });
    // Verificar que el archivo exista físicamente si corresponde
    try {
      if (imagePath) {
        const onDisk = path.join(process.cwd(), 'storage', imagePath);
        console.log('[news] saved image exists?', fs.existsSync(onDisk), onDisk);
      }
    } catch {}
    res.json(serializeNews(created));
  } catch (err) {
    next(err);
  }
}

export async function updateNews(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Noticia no encontrada' });

    const { title, content, is_active, display_order } = req.body || {};
    let data = {
      updated_at: new Date(),
    };
    if (typeof title !== 'undefined') data.title = String(title);
    if (typeof content !== 'undefined') data.content = String(content);
    if (typeof is_active !== 'undefined') data.is_active = (is_active === '1' || is_active === 1 || is_active === true);
    if (typeof display_order !== 'undefined' && display_order !== '') data.display_order = Number(display_order);
    if (req.file) {
      const newPath = path.join('news', req.file.filename).replace(/\\/g, '/');
      // opcional: eliminar imagen anterior si existía
      if (existing.image) {
        try {
          const oldFsPath = path.join(process.cwd(), 'storage', existing.image);
          fs.unlinkSync(oldFsPath);
        } catch {}
      }
      data.image = newPath;
    }

    const updated = await prisma.news.update({ where: { id }, data });
    res.json(serializeNews(updated));
  } catch (err) {
    next(err);
  }
}

export async function deleteNews(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Noticia no encontrada' });
    await prisma.news.delete({ where: { id } });
    // opcional: eliminar imagen
    if (existing.image) {
      try {
        const oldFsPath = path.join(process.cwd(), 'storage', existing.image);
        fs.unlinkSync(oldFsPath);
      } catch {}
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
