import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export default function ResetPassword(){
  const [sp] = useSearchParams();
  const token = sp.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(()=>{ if (!token) setMsg('Enlace inválido'); }, [token]);

  const submit = async (e)=>{
    e.preventDefault(); if (!token) return;
    if (password.length < 6) { setMsg('La contraseña debe tener al menos 6 caracteres'); return; }
    if (password !== confirm) { setMsg('Las contraseñas no coinciden'); return; }
    setLoading(true); setMsg('');
    try{
      await api.post('/auth/reset-password', { token, password, password_confirmation: confirm });
      setOk(true);
      setTimeout(()=> nav('/login'), 1500);
    } catch(e){
      setMsg('El enlace es inválido o expiró');
    } finally { setLoading(false); }
  };

  return (
    <main className="container" style={{padding:'16px'}}>
      <form onSubmit={submit} className="formulario" style={{maxWidth:520, margin:'24px auto'}}>
        <h2 style={{textAlign:'center', color:'var(--brand)', marginBottom:18}}>Restablecer contraseña</h2>
        {!ok ? (
          <>
            <label>Nueva contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required placeholder="Mínimo 6 caracteres" />
            <label>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} required placeholder="Repite tu contraseña" />
            <div className="login-actions solo-boton">
              <button className="btn btn-success w-100" disabled={loading || !token}>{loading? 'Guardando...' : 'Guardar y continuar'}</button>
            </div>
            {msg && <div className="error-msg" style={{marginTop:8}}>{msg}</div>}
          </>
        ) : (
          <div className="nota" style={{marginTop:8}}>Contraseña actualizada. Redirigiendo al login...</div>
        )}
      </form>
    </main>
  );
}
