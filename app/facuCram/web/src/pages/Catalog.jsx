import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Catalog() {
  const [filters, setFilters] = useState({ motors: [], rubros: [] });
  const [q, setQ] = useState('');
  const [motor, setMotor] = useState('');
  const [rubro, setRubro] = useState('');
  const [onlyStock, setOnlyStock] = useState(false);
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState({ data: [], total: 0, per_page: 50, current_page: 1, last_page: 1 });

  useEffect(() => {
    api.get('/catalogo/filters').then(r => setFilters(r.data)).catch(()=>{});
  }, []);

  useEffect(() => {
    const params = { q, motor, rubro, only_stock: onlyStock ? 1 : 0, page };
    api.get('/catalogo', { params }).then(r => setResp(r.data)).catch(()=>{});
  }, [q, motor, rubro, onlyStock, page]);

  return (
    <div>
      <h1>Catálogo</h1>
      <div style={{ display:'flex', gap: 12, marginBottom: 12 }}>
        <input placeholder="Buscar" value={q} onChange={e=>setQ(e.target.value)} />
        <select value={motor} onChange={e=>setMotor(e.target.value)}>
          <option value="">Motor</option>
          {filters.motors.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={rubro} onChange={e=>setRubro(e.target.value)}>
          <option value="">Rubro</option>
          {filters.rubros.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <label>
          <input type="checkbox" checked={onlyStock} onChange={e=>setOnlyStock(e.target.checked)} /> Solo stock
        </label>
      </div>
      <ul>
        {resp.data.map(p => (
          <li key={p.code}>{p.articulo} – {p.rubro} – {p.motor} – ${p.price}</li>
        ))}
      </ul>
      <div style={{ marginTop: 12 }}>
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
        <span style={{ margin:'0 8px' }}>{resp.current_page}/{resp.last_page}</span>
        <button disabled={page>=resp.last_page} onClick={()=>setPage(p=>p+1)}>Siguiente</button>
      </div>
    </div>
  );
}
