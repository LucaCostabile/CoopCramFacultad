export function role(...allowed) {
  return (req, res, next) => {
    const r = req.user?.role;
    if (!r || !allowed.includes(r)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}
