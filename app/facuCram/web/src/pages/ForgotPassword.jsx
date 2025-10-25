import { useState } from 'react';
import { api } from '../services/api';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e)=>{
    e.preventDefault(); setMsg(''); setLoading(true);
    try{
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch(e){
      setMsg('No se pudo enviar el correo. Intentá nuevamente.');
    } finally { setLoading(false); }
  };

  return (
    <main className="container" style={{padding:'16px'}}>
      <form onSubmit={submit} className="formulario" style={{maxWidth:480, margin:'24px auto'}}>
        <h2 style={{textAlign:'center', color:'var(--brand)', marginBottom:18}}>¿Olvidaste tu contraseña?</h2>
        {!sent ? (
          <>
            <div className="nota" style={{marginBottom:10}}>
              Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña. El enlace vence en 6 horas.
            </div>
            <label>Correo electrónico</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="usuario@ejemplo.com" />
            <div className="login-actions solo-boton">
              <button className="btn btn-success w-100" disabled={loading}>{loading? 'Enviando...' : 'Enviar enlace'}</button>
            </div>
            {msg && <div className="error-msg" style={{marginTop:8}}>{msg}</div>}
          </>
        ) : (
          <div className="nota" style={{marginBottom:10}}>
            Si el correo está registrado, vas a recibir un enlace para restablecer tu contraseña. Revisá también la carpeta de spam.
          </div>
        )}
      </form>
    </main>
  );
}
