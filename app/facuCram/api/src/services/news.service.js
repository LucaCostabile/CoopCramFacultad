export const newsService = {
  async listActive() {
    return [
      { id: 1, title: 'Bienvenido a CRAM', content: 'Novedades y actualizaciones', is_active: true, display_order: 1 },
    ];
  }
};
