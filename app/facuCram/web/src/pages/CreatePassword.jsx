import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function CreatePassword(){
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { setPassword: setPwd } = useAuth();

  const submit = async (e)=>{
    e.preventDefault(); setMsg(''); setLoading(true);
    try {
      await setPwd(password, confirm);
      nav('/');
    } catch (e) {
      setMsg('No se pudo guardar la contraseña');
    } finally { setLoading(false); }
  };

  return (
    <main className="container" style={{padding:'16px'}}>
      <form onSubmit={submit} className="formulario" style={{maxWidth:520, margin:'24px auto'}}>
        <h2 style={{textAlign:'center', color:'var(--brand)', marginBottom:18}}>Crear nueva contraseña</h2>
        <div className="nota" style={{marginBottom:10}}>
          Ingresá tu nueva contraseña para continuar.
        </div>
        <label>Nueva contraseña</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required placeholder="Mínimo 6 caracteres" />
        <label>Confirmar contraseña</label>
        <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={6} required placeholder="Repite tu contraseña" />
        <div className="login-actions solo-boton">
          <button className="btn btn-success w-100" disabled={loading}>{loading? 'Guardando...' : 'Guardar y continuar'}</button>
        </div>
        {msg && <div className="error-msg" style={{marginTop:8}}>{msg}</div>}
      </form>
    </main>
  );
}
