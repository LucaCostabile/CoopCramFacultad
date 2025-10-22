export function normalizeId(raw) {
  if (!raw) return null;
  return String(raw).replace(/\s+/g, '').replace(/-/g, '');
}

export function detectRoleFromId(id) {
  const first = id ? id.charAt(0) : null;
  if (!first) return 'sin_rol';
  switch (first) {
    case '1':
    case '2':
    case '6':
      return 'cliente';
    case '3':
      return 'soporte';
    case '4':
      return 'trabajador';
    case '5':
      return 'marketing';
    case '9':
      return 'administrador';
    default:
      return 'sin_rol';
  }
}
