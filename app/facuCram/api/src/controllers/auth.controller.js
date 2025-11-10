import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { normalizeId } from '../utils/userId.js';
import { signToken } from '../utils/jwt.js';
import { sendMail } from '../utils/mailer.js';

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
    // Registrar intentos de login (no registrar contraseñas)
    try { console.log(`[auth.login] intento de login para id=${String(loginField).slice(0,50)}`); } catch(e){}
    if (!loginField || !password) return res.status(400).json({ error: 'login y password requeridos' });
    const user = await findUserByLogin(loginField);
    try { console.log(`[auth.login] usuario encontrado=${!!user} id=${user?.id || 'n/a'} passwordExists=${!!user?.password}`); } catch(e){}
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

// =========== Recuperación de contraseña ===========
export async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const user = await prisma.users.findUnique({ where: { email } }).catch(() => null);
    // Siempre respondemos 200 para evitar enumeración de usuarios
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    await prisma.password_reset_tokens.upsert({
      where: { email },
      update: { token, created_at: now },
      create: { email, token, created_at: now }
    });

    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${base}/restablecer-contrasena?token=${encodeURIComponent(token)}`;

    try {
      const result = await sendMail({
        to: email,
        subject: 'Recuperación de contraseña - Cooperativa CRAM',
        html: `
          <p>Hola ${user.name || ''},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Hacé clic en el siguiente enlace para continuar:</p>
          <p><a href="${link}" target="_blank">Restablecer contraseña</a></p>
          <p>Este enlace expira en 6 horas.</p>
          <p>Si vos no solicitaste este cambio, podés ignorar este correo.</p>
        `
      });
      console.log('[mail.forgotPassword] enviado', { accepted: result.accepted, rejected: result.rejected, response: result.response });
    } catch (mailErr) {
      console.error('[mail.forgotPassword] error enviando correo:', mailErr?.message || mailErr);
      // No revelamos fallo al cliente para evitar enumeración, pero lo dejamos logeado.
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password, password_confirmation } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token requerido' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña mínima 6 caracteres' });
    if (password_confirmation && password !== password_confirmation) return res.status(400).json({ error: 'Las contraseñas no coinciden' });

    const row = await prisma.password_reset_tokens.findFirst({ where: { token } });
    if (!row) return res.status(400).json({ error: 'Token inválido o expirado' });
    const created = row.created_at ? new Date(row.created_at) : null;
    const sixHoursMs = 6 * 60 * 60 * 1000;
    if (!created || (Date.now() - created.getTime()) > sixHoursMs) {
      // Expirado: borrar token
      await prisma.password_reset_tokens.delete({ where: { email: row.email } }).catch(() => {});
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const user = await prisma.users.findUnique({ where: { email: row.email } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const hash = await bcrypt.hash(password, 10);
    await prisma.users.update({ where: { id: user.id }, data: { password: hash, updated_at: new Date() } });
    await prisma.password_reset_tokens.delete({ where: { email: row.email } }).catch(() => {});

    res.json({ ok: true });
  } catch (err) { next(err); }
}
