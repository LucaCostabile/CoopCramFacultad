import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function NewsManage(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({ title: '', content: '', image: null, is_active: true, display_order: '' });
  const [editing, setEditing] = useState(null); // id que se edita

  async function fetchAll(){
    try{
      setLoading(true);
      const r = await api.get('/news/all');
      setItems(r.data || []);
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ fetchAll(); },[]);

  const onCreate = async (e)=>{
    e.preventDefault();
    try{
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      fd.append('is_active', form.is_active ? '1' : '0');
      if (form.display_order !== '') fd.append('display_order', String(form.display_order));
  if (form.image) fd.append('image', form.image, form.image.name || 'upload.jpg');
  // No establezcas Content-Type manualmente; el navegador agrega el boundary correcto
  await api.post('/news', fd);
      setMessage('Noticia creada');
      setForm({ title: '', content: '', image: null, is_active: true, display_order: '' });
      await fetchAll();
    }catch(err){ console.error(err); setMessage('Error al crear noticia'); }
  };

  const onUpdate = async (id, data, file)=>{
    const fd = new FormData();
    if (typeof data.title !== 'undefined') fd.append('title', data.title);
    if (typeof data.content !== 'undefined') fd.append('content', data.content);
    if (typeof data.is_active !== 'undefined') fd.append('is_active', data.is_active ? '1' : '0');
    if (typeof data.display_order !== 'undefined') fd.append('display_order', String(data.display_order ?? ''));
  if (file) fd.append('image', file, file.name || 'upload.jpg');
  await api.put(`/news/${id}`, fd);
  };

  const onDelete = async (id)=>{
    if (!confirm('¿Eliminar esta noticia?')) return;
    await api.delete(`/news/${id}`);
    await fetchAll();
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h4 m-0">Novedades y Noticias</h1>
      </div>

      {message && <div className="alert alert-info" role="alert">{message}</div>}

      {/* Crear noticia */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5">Crear noticia</h2>
          <form className="row g-3" onSubmit={onCreate}>
            <div className="col-12">
              <label className="form-label">Título</label>
              <input className="form-control" required value={form.title} onChange={e=>setForm(v=>({...v, title: e.target.value}))} />
            </div>
            <div className="col-12">
              <label className="form-label">Contenido</label>
              <textarea className="form-control" rows={5} required value={form.content} onChange={e=>setForm(v=>({...v, content: e.target.value}))} />
            </div>
            <div className="col-12">
              <label className="form-label">Imagen (opcional)</label>
              <input type="file" className="form-control" accept="image/*" onChange={e=>setForm(v=>({...v, image: e.target.files?.[0] || null}))} />
            </div>
            <div className="col-12 form-check">
              <input className="form-check-input" id="new_is_active" type="checkbox" checked={form.is_active} onChange={e=>setForm(v=>({...v, is_active: e.target.checked}))} />
              <label className="form-check-label" htmlFor="new_is_active">Mostrar en el carrusel</label>
            </div>
            <div className="col-12">
              <label className="form-label">Posición en el carrusel</label>
              <input type="number" className="form-control" min={1} value={form.display_order} onChange={e=>setForm(v=>({...v, display_order: e.target.value}))} placeholder="1 = primera, 2 = segunda, ..." />
            </div>
            <div className="col-12">
              <button className="btn btn-success">Guardar</button>
            </div>
          </form>
        </div>
      </div>

      {/* Listado */}
      <div className="row g-3">
        {loading ? (
          <div className="col-12"><div className="alert alert-secondary mb-0">Cargando...</div></div>
        ) : items.length === 0 ? (
          <div className="col-12"><div className="alert alert-info mb-0">No hay noticias cargadas.</div></div>
        ) : (
          items.map(n => (
            <div key={n.id} className="col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h3 className="h5 mb-1">{n.title}</h3>
                      <div className="text-muted mb-2">{n.created_at ? new Date(n.created_at).toLocaleDateString() : ''}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-primary" type="button" onClick={()=> setEditing(editing === n.id ? null : n.id)}>Editar</button>
                      <button className="btn btn-sm btn-danger" onClick={()=> onDelete(n.id)}>Eliminar</button>
                    </div>
                  </div>

                  <p className="mb-0" style={{ whiteSpace:'pre-line', wordBreak:'break-word', overflowWrap:'anywhere', hyphens:'auto' }}>{n.content}</p>
                  {n.image && (
                    <div className="mt-3">
                      <img src={n.image?.startsWith('http') ? n.image : `/storage/${n.image}`} alt="Imagen" style={{ maxWidth:240, borderRadius:8 }} />
                    </div>
                  )}

                  {editing === n.id && (
                    <div className="mt-3">
                      <div className="card card-body">
                        <EditForm item={n} onSaved={async ()=>{ setEditing(null); await fetchAll(); }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function EditForm({ item, onSaved }){
  const [title, setTitle] = useState(item.title || '');
  const [content, setContent] = useState(item.content || '');
  const [isActive, setIsActive] = useState(Boolean(item.is_active));
  const [displayOrder, setDisplayOrder] = useState(item.display_order ?? '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e)=>{
    e.preventDefault();
    try{
      setSaving(true);
      const fd = new FormData();
      fd.append('title', title);
      fd.append('content', content);
      fd.append('is_active', isActive ? '1' : '0');
      fd.append('display_order', String(displayOrder ?? ''));
  if (file) fd.append('image', file, file.name || 'upload.jpg');
  await api.put(`/news/${item.id}`, fd);
      onSaved?.();
    } finally { setSaving(false); }
  };

  return (
    <form className="row g-3" onSubmit={submit}>
      <div className="col-12">
        <label className="form-label">Título</label>
        <input className="form-control" value={title} onChange={e=>setTitle(e.target.value)} required />
      </div>
      <div className="col-12">
        <label className="form-label">Contenido</label>
        <textarea className="form-control" rows={5} value={content} onChange={e=>setContent(e.target.value)} required />
      </div>
      <div className="col-12">
        <label className="form-label">Imagen (opcional)</label>
        <input type="file" className="form-control" accept="image/*" onChange={e=>setFile(e.target.files?.[0] || null)} />
      </div>
      <div className="col-12 form-check">
        <input className="form-check-input" type="checkbox" id={`is_active_${item.id}`} checked={isActive} onChange={e=>setIsActive(e.target.checked)} />
        <label className="form-check-label" htmlFor={`is_active_${item.id}`}>Mostrar en el carrusel</label>
      </div>
      <div className="col-12">
        <label className="form-label">Posición en el carrusel</label>
        <input type="number" className="form-control" min={1} value={displayOrder} onChange={e=>setDisplayOrder(e.target.value)} placeholder="1 = primera, 2 = segunda, ..." />
      </div>
      <div className="col-12">
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Actualizar'}</button>
      </div>
    </form>
  );
}
