import axios from 'axios';

export const api = axios.create({
  // Por defecto usar ruta relativa /api para que funcione en cualquier URL con proxy (dev) y mismo dominio (prod).
  // Puedes definir VITE_API_URL para apuntar a otro host en despliegues especiales.
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Adjuntar token guardado en cada request (evita condiciones de carrera al cargar la app)
api.interceptors.request.use((config) => {
  try {
    const saved = localStorage.getItem('auth');
    if (saved) {
      const { token } = JSON.parse(saved);
      if (token) {
        config.headers = config.headers || {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});
