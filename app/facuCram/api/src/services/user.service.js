// TODO: Implementar acceso a usuarios (findById, checkFieldExists, toggleUser, etc.)
export const userService = {
  async findById(id) { return { id, name: 'Demo', role: 'cliente' }; },
};
