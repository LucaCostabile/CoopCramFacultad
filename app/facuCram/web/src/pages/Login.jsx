import { useState } from 'react';
import { api } from '../services/api';

export default function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      const r = await api.post('/auth/login', { id, password });
      setMsg('Login OK (mock): ' + r.data.user.name);
    } catch (e) {
      setMsg('Error de login');
    }
  };
  return (
    <form onSubmit={submit}>
      <h1>Login</h1>
      <input placeholder="ID" value={id} onChange={e=>setId(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button>Entrar</button>
      <div>{msg}</div>
    </form>
  );
}
