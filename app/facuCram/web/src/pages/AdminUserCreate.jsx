import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function detectRoleFromId(id){
  const first = id?.charAt(0);
  switch(first){
    case '1':
    case '2':
    case '6': return 'cliente';
    case '3': return 'soporte';
    case '4': return 'trabajador';
    case '5': return 'marketing';
    case '9': return 'administrador';
    default: return 'sin_rol';
  }
}
function normalizeId(v){ return String(v||'').replace(/\s+/g,'').replace(/-/g,''); }

export default function AdminUserCreate(){
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const normId = useMemo(()=> normalizeId(id), [id]);
  const role = useMemo(()=> detectRoleFromId(normId), [normId]);

  const submit = async (e)=>{
    e.preventDefault(); setMsg(''); setLoading(true);
    try {
      await api.post('/usuarios', { id, name, email: email||undefined, phone: phone||undefined });
      nav('/admin/usuarios');
    } catch (e) {
      const err = e?.response?.data?.error || 'No se pudo crear el usuario';
      setMsg(err);
    } finally { setLoading(false); }
  };

  return (
    <main className="container main-admin" style={{padding:'16px'}}>
      <h3 className="mb-3" style={{marginBottom:12}}>Crear usuario</h3>
      <form onSubmit={submit} className="card" style={{padding:16}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:12}}>
          <div>
            <label className="form-label">ID (número de cuenta)</label>
            <input className="form-control" value={id} onChange={e=>setId(e.target.value)} placeholder="Ej: 1-001" required />
            <div className="small" style={{marginTop:6}}>Se normaliza quitando guiones. El primer dígito define el rol.</div>
          </div>
          <div>
            <label className="form-label">Nombre</label>
            <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Email (opcional)</label>
            <input className="form-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
          </div>
          <div>
            <label className="form-label">Teléfono (opcional)</label>
            <input className="form-control" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Ej: 261 555-1234" />
          </div>
          <div>
            <label className="form-label">Rol detectado</label>
            <div><span className="badge badge-secondary">{role}</span></div>
          </div>
        </div>
        <div style={{display:'flex', gap:8, marginTop:12}}>
          <button className="btn btn-primary" disabled={loading}>{loading? 'Guardando...' : 'Guardar'}</button>
          <button type="button" className="btn btn-outline" onClick={()=>nav('/admin/usuarios')}>Cancelar</button>
        </div>
        {msg && <div className="error-msg" style={{marginTop:8}}>{msg}</div>}
      </form>
    </main>
  );
}
