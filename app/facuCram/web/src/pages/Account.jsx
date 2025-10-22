import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';

export default function Account(){
  const { user: sessionUser } = useAuth();
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [itemsCache, setItemsCache] = useState({}); // orderId -> items array

  const userId = useMemo(()=> sessionUser?.id || user?.id, [sessionUser, user]);

  useEffect(()=>{
    let active = true;
    (async()=>{
      try {
        const r = await api.get('/account');
        if (!active) return;
        setUser(r.data);
        setEmail(r.data?.email || '');
        setPhone(r.data?.phone || '');
      } catch (e) {
        // ignore
      }
    })();
    return ()=>{ active=false; };
  },[]);

  useEffect(()=>{
    // initial orders load
    loadOrders(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function loadOrders(nextPage, replace=false){
    try {
      setLoadingOrders(true);
      const r = await api.get('/account/orders', { params: { page: nextPage }});
      const data = r.data?.data || [];
      setOrders(prev => replace ? data : [...prev, ...data]);
      setPage(r.data?.current_page || nextPage);
      const last = r.data?.last_page || nextPage;
      setHasMore((r.data?.current_page || nextPage) < last);
    } catch (e) {
      // ignore
    } finally {
      setLoadingOrders(false);
    }
  }

  async function onSave(e){
    e.preventDefault();
    setSaving(true); setStatus(''); setError('');
    try {
      const r = await api.patch('/account', { email: email || null, phone: phone || null });
      setUser(r.data);
      setStatus('Cambios guardados.');
      // Opcional: actualizar almacenamiento local para reflejar email/phone
      try {
        const saved = localStorage.getItem('auth');
        if (saved) {
          const obj = JSON.parse(saved);
          obj.user = { ...obj.user, email: r.data.email, phone: r.data.phone };
          localStorage.setItem('auth', JSON.stringify(obj));
        }
      } catch{}
    } catch (e) {
      const msg = e?.response?.data?.error || 'No se pudo guardar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleItems(orderId){
    const el = document.querySelector(`[data-order-id="${orderId}"] .pedido-items`);
    if (!el) return;
    const isHidden = el.style.display === 'none' || !el.style.display;
    if (isHidden) {
      el.style.display = 'block';
      if (!itemsCache[orderId]){
        // fetch items
        try {
          const loader = el.querySelector('.items-loading');
          const table = el.querySelector('.tabla-items');
          if (loader) loader.style.display = 'block';
          if (table) table.style.display = 'none';
          const r = await api.get(`/account/orders/${orderId}/items`);
          const items = Array.isArray(r.data) ? r.data : [];
          setItemsCache(prev => ({ ...prev, [orderId]: items }));
          if (loader) loader.style.display = 'none';
          if (table) table.style.display = '';
        } catch (e) {
          const loader = el.querySelector('.items-loading');
          if (loader) loader.textContent = 'No se pudo cargar los productos.';
        }
      }
    } else {
      el.style.display = 'none';
    }
  }

  return (
    <div className="container">
      <main className="main-cuenta">
        <section className="formulario usuario">
          <h2>Mi Cuenta</h2>
          {status && <div className="nota" role="status">{status}</div>}
          {error && <div className="error-msg" role="alert" style={{marginTop:6}}>{error}</div>}
          <form onSubmit={onSave}>
            <div className="datos-grid" style={{display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit, minmax(240px,1fr))'}}>
              <div>
                <label>ID:</label>
                <div style={{color:'#388e3c', fontWeight:600}}>{userId || '-'}</div>
              </div>
              <div>
                <label>Nombre:</label>
                <div>{user?.name || sessionUser?.name || '-'}</div>
              </div>
              <div>
                <label>Email:</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Tu correo" />
                {!email && <div style={{color:'#b91c1c', fontWeight:700, marginTop:6}}>Recomendado: agregá tu correo para recuperar la contraseña.</div>}
              </div>
              <div>
                <label>Teléfono:</label>
                <input type="text" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej: 261 555-1234" />
                {!phone && <div style={{color:'#b91c1c', fontWeight:700, marginTop:6}}>Recomendado: agregá un teléfono de contacto.</div>}
              </div>
              <div>
                <label>Contraseña:</label>
                <input type="password" value="********" readOnly />
              </div>
              {((user?.role || sessionUser?.role) !== 'cliente') && (
                <div>
                  <label>Rol:</label>
                  <span>{user?.role || sessionUser?.role || 'Usuario'}</span>
                </div>
              )}
            </div>
            <div className="login-actions solo-boton" style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end'}}>
              <button className="btn-success" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        </section>

        <section className="formulario pedidos" style={{marginTop:32}}>
          <h2>Mis pedidos</h2>
          <div id="orders-list" className="lista-pedidos">
            {orders.length === 0 && !loadingOrders && (
              <div style={{color:'#6b7280'}}>Aún no tenés pedidos.</div>
            )}
            {orders.map(o => (
              <article key={o.id} className="pedido" data-order-id={o.id} style={{marginBottom:12}}>
                <header className="pedido-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
                  <div>
                    <div className="pedido-title" style={{fontWeight:700}}>Pedido #{o.id}</div>
                    <div className="pedido-date">{o.created_at ? new Date(o.created_at).toLocaleDateString('es-AR') : ''}</div>
                  </div>
                  <div className="pedido-stats" style={{display:'flex', alignItems:'center', gap:12, flexWrap:'wrap'}}>
                    <div><strong>Items:</strong> {o.items_count}</div>
                    {o.total != null && <div><strong>Total:</strong> ${Number(o.total).toLocaleString('es-AR',{minimumFractionDigits:2})}</div>}
                    {o.status && <span className="badge badge-secondary">{o.status}</span>}
                    <button type="button" className="btn-outline btn-sm btn-toggle-items" onClick={()=>toggleItems(o.id)}>Ver productos</button>
                  </div>
                </header>
                <div className="pedido-items" style={{display:'none'}}>
                  <div className="items-loading">Cargando…</div>
                  <table className="tabla-items" style={{display:'none'}}>
                    <thead>
                      <tr style={{textAlign:'left', borderBottom:'1px solid #e5e7eb'}}>
                        <th style={{padding:'6px 8px'}}>Código</th>
                        <th style={{padding:'6px 8px'}}>Artículo</th>
                        <th style={{padding:'6px 8px'}}>Inf. Técnica</th>
                        <th style={{padding:'6px 8px'}}>Cantidad</th>
                        <th style={{padding:'6px 8px'}}>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(itemsCache[o.id]||[]).map(it => {
                        const info = String(it.info_tecnica||'');
                        return (
                          <tr key={it.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                            <td style={{padding:'6px 8px'}}>{it.product_code ?? '-'}</td>
                            <td style={{padding:'6px 8px'}}>{(it.name ?? '')}</td>
                            <td style={{padding:'6px 8px', maxWidth:260, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={info}>{info}</td>
                            <td style={{padding:'6px 8px'}}>{it.quantity ?? '-'}</td>
                            <td style={{padding:'6px 8px'}}>{it.price != null ? '$'+Number(it.price).toLocaleString('es-AR',{minimumFractionDigits:2}) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
          <div style={{display:'flex', justifyContent:'center', marginTop:12}}>
            {hasMore && (
              <button className="btn-outline" disabled={loadingOrders} onClick={()=>loadOrders(page+1)}>{loadingOrders? 'Cargando...' : 'Ver más'}</button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

