import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [loginField, setLoginField] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { login } = useAuth();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      const r = await login(loginField, password);
      if (r?.mustCreatePassword) {
        nav('/crear-contrasena');
      } else {
        nav('/');
      }
    } catch (e) {
      setMsg('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="container" style={{padding:'16px'}}>
      <form onSubmit={submit} className="formulario" style={{maxWidth:480, margin:'24px auto'}}>
        <h2 style={{textAlign:'center', color:'var(--brand)', marginBottom:18}}>Iniciar Sesión</h2>
        <label>ID, Email o Celular</label>
        <input placeholder="Ingresá tu ID, email o celular" value={loginField} onChange={e=>setLoginField(e.target.value)} required />
        <label>Contraseña</label>
        <input placeholder="Contraseña" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div className="login-actions">
          <button className="btn btn-success w-100" disabled={loading}>{loading? 'Ingresando...' : 'Ingresar'}</button>
        </div>
        <div style={{marginTop:10, textAlign:'center'}}>
          <Link to="/olvide-contrasena" className="muted">¿Olvidaste tu contraseña?</Link>
        </div>
        {msg && <div className="error-msg" style={{marginTop:8}}>{msg}</div>}
      </form>
    </main>
  );
}
