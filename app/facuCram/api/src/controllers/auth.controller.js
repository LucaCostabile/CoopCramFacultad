export async function login(req, res, next) {
  try {
    const { id, password } = req.body;
    // TODO: validar con DB; por ahora mock ok
    if (!id || !password) return res.status(400).json({ error: 'id y password requeridos' });
    return res.json({ token: 'mock-jwt', user: { id, name: 'Usuario Demo' } });
  } catch (err) {
    next(err);
  }
}
