import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
});

// Attach saved token if exists
try {
  const saved = localStorage.getItem('auth');
  if (saved) {
    const { token } = JSON.parse(saved);
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
} catch {}
