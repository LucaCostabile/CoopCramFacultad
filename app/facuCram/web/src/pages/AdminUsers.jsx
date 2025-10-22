import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';

function Row({ u, onSave, onToggle }){
  const [name, setName] = useState(u.name || '');
  const [role, setRole] = useState(u.role || 'sin_rol');
  return (
    <tr>
      <td><strong>{u.id}</strong></td>
      <td><input value={name} onChange={e=>setName(e.target.value)} /></td>
      <td>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="cliente">cliente</option>
          <option value="soporte">soporte</option>
          <option value="trabajador">trabajador</option>
          <option value="marketing">marketing</option>
          <option value="administrador">administrador</option>
          <option value="sin_rol">sin_rol</option>
        </select>
      </td>
      <td>
        <span className="badge badge-secondary">{u.is_disabled ? 'Inhabilitado' : 'Activo'}</span>
      </td>
      <td>
        <button className="btn btn-sm btn-primary" onClick={()=>onSave(u.id,{name,role})}>Guardar</button>{' '}
        <button className="btn btn-sm btn-outline" onClick={()=>onToggle(u.id,!u.is_disabled)}>{u.is_disabled?'Habilitar':'Inhabilitar'}</button>
      </td>
    </tr>
  );
}

export default function AdminUsers(){
  const [q,setQ]=useState('');
  const [page,setPage]=useState(1);
  const [rows,setRows]=useState([]);
  const [total,setTotal]=useState(0);
  const pageSize=20;
  const pages=useMemo(()=>Math.max(1, Math.ceil(total/pageSize)),[total]);

  const load=async()=>{
    const r=await api.get('/usuarios',{params:{search:q,page,pageSize}});
    setRows(r.data.items);
    setTotal(r.data.total);
  };
  useEffect(()=>{ load(); },[q,page]);

  const save=async(id,data)=>{ await api.put(`/usuarios/${id}`,data); load(); };
  const toggle=async(id,is_disabled)=>{ await api.patch(`/usuarios/${id}/disable`,{is_disabled}); load(); };

  return (
    <main className="container main-admin" style={{padding:'16px'}}>
      <div className="d-flex" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <h3 className="mb-0">Usuarios</h3>
        <Link className="btn btn-primary" to="/admin/usuarios/crear">➕ Nuevo usuario</Link>
      </div>
      <div className="formulario" style={{marginBottom:12}}>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <input placeholder="Buscar por ID/Nombre/Rol" value={q} onChange={e=>{setQ(e.target.value); setPage(1);} } />
          <span className="muted">Total: {total}</span>
        </div>
      </div>
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Rol</th><th>Email</th><th>Teléfono</th><th>Estado</th><th className="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=> (
              <RowEmailPhone key={r.id} u={r} onSave={save} onToggle={toggle} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn btn-outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>« Anterior</button>
        <span>Página {page} / {pages}</span>
        <button className="btn btn-outline" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Siguiente »</button>
      </div>
    </main>
  );
}

function RowEmailPhone({ u, onSave, onToggle }){
  const [email, setEmail] = useState(u.email || '');
  const [phone, setPhone] = useState(u.phone || '');
  return (
    <tr>
      <td><strong>{u.id}</strong></td>
      <td>{u.name}</td>
      <td><span className="badge badge-secondary">{u.role}</span></td>
      <td><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="usuario@ejemplo.com" /></td>
      <td><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="261 555-1234" /></td>
      <td>
        <span className="badge badge-secondary">{u.is_disabled ? 'Inhabilitado' : 'Activo'}</span>
      </td>
      <td>
        <button className="btn btn-sm btn-primary" onClick={()=>onSave(u.id,{email,phone})}>Guardar</button>{' '}
        <button className="btn btn-sm btn-outline" onClick={()=>onToggle(u.id,!u.is_disabled)}>{u.is_disabled?'Habilitar':'Inhabilitar'}</button>
      </td>
    </tr>
  );
}
