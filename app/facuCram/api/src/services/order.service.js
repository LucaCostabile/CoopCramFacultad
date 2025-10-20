export const orderService = {
  async create({ userId, items, comment }) {
    // TODO: persistir orden y calcular totales
    return { id: Date.now(), userId, total: 0, status: 'pending', comment: comment || null };
  }
};
