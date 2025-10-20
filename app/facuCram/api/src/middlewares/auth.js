export function auth(req, res, next) {
  // TODO: verificar JWT; por ahora permitir y simular user
  req.user = { id: '1000', role: 'cliente' };
  next();
}
