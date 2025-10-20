import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Home() {
  const [news, setNews] = useState([]);
  useEffect(() => {
    api.get('/news').then(r => setNews(r.data)).catch(() => setNews([]));
  }, []);
  return (
    <div>
      <h1>Novedades</h1>
      <ul>
        {news.map(n => (
          <li key={n.id}><strong>{n.title}</strong> – {n.content}</li>
        ))}
      </ul>
    </div>
  );
}
