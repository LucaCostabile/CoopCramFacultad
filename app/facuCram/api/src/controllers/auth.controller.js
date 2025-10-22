import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { normalizeId } from '../utils/userId.js';
import { signToken } from '../utils/jwt.js';

function isEmail(v){ return /@/.test(v); }
function isPhone(v){ return /^[0-9+\-\s]+$/.test(v) && !/@/.test(v); }

async function findUserByLogin(login){
  const byId = await prisma.users.findUnique({ where: { id: normalizeId(login) } }).catch(()=>null);
  if (byId) return byId;
  if (isEmail(login)) {
    const u = await prisma.users.findUnique({ where: { email: String(login).toLowerCase() } }).catch(()=>null);
    if (u) return u;
  }
  if (isPhone(login)) {
    const u = await prisma.users.findUnique({ where: { phone: String(login) } }).catch(()=>null);
    if (u) return u;
  }
  return null;
}

export async function login(req, res, next) {
  try {
    const { id: loginField, password } = req.body;
    if (!loginField || !password) return res.status(400).json({ error: 'login y password requeridos' });
    const user = await findUserByLogin(loginField);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (user.is_disabled) return res.status(403).json({ error: 'Usuario inhabilitado' });

    const normalizedId = normalizeId(user.id);
    // Primer inicio: sin contraseña guardada
    if (!user.password) {
      const expected = `${normalizedId}-CRAM`;
      if (password !== expected) return res.status(401).json({ error: 'Credenciales inválidas' });
      const temp = signToken({ sub: user.id, role: user.role, action: 'set_password' }, { expiresIn: '10m' });
      return res.json({ mustCreatePassword: true, token: temp, user: { id: user.id, name: user.name, role: user.role } });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    // actualizar métricas de login
    await prisma.users.update({
      where: { id: user.id },
      data: { login_count: BigInt((Number(user.login_count||0)) + 1), last_login_at: new Date() }
    }).catch(()=>{});

    const token = signToken({ sub: user.id, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function setPassword(req, res, next) {
  try {
    // El token viene en Authorization y debe tener action=set_password
    const userId = req.user?.sub;
    const action = req.user?.action;
    if (!userId || action !== 'set_password') return res.status(401).json({ error: 'No autorizado' });
    const { password, password_confirmation } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña mínima 6 caracteres' });
    if (password_confirmation && password !== password_confirmation) return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.update({ where: { id: userId }, data: { password: hash, updated_at: new Date() } });
    const token = signToken({ sub: user.id, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ error: 'No autorizado' });
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { id:true, name:true, role:true, is_disabled:true } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
