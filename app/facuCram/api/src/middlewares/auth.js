import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No autorizado" });
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRoles(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "No autorizado" });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Prohibido" });
    }
    next();
  };
}
export function auth(req, res, next) {
  // TODO: verificar JWT; por ahora permitir y simular user
  req.user = { id: "1000", role: "cliente" };
  next();
}
