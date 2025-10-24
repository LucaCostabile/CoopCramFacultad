import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api';

export default function Header(){
  const { user, logout } = useAuth();
  const role = user?.role;
  const [open, setOpen] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const wrapRef = useRef(null);
  const loc = useLocation();
  const navigate = useNavigate();

  // Mostrar/ocultar el botón de login en rutas específicas
  const hideLoginBtn = useMemo(()=> ['/login', '/forgot-password'].includes(loc.pathname), [loc.pathname]);

  // Indicador de pedidos "recibido" para algunos roles
  useEffect(()=>{
    let alive = true;
    async function check(){
      try{
        if(!user || !['trabajador','soporte','administrador'].includes(role)) { setHasPending(false); return; }
        const r = await api.get('/pedidos');
        const items = Array.isArray(r.data) ? r.data : [];
        const any = items.some(o => (o?.status || '').toLowerCase() === 'recibido');
        if(alive) setHasPending(any);
      }catch{ if(alive) setHasPending(false); }
    }
    check();
    const id = setInterval(check, 60_000); // refresco cada minuto
    return ()=>{ alive = false; clearInterval(id); };
  }, [user, role]);

  // Click fuera para cerrar
  useEffect(()=>{
    function onDocClick(e){ if(wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('click', onDocClick);
    return ()=> document.removeEventListener('click', onDocClick);
  },[]);

  // Actualizar variable CSS con altura real del header
  useEffect(()=>{
    const headerEl = document.querySelector('header.site-header');
    if(!headerEl) return;
    const setOffset = ()=>{
      const h = headerEl.offsetHeight || 0;
      document.documentElement.style.setProperty('--header-offset', h + 'px');
    };
    setOffset();
    window.addEventListener('resize', setOffset);
    window.addEventListener('load', setOffset);
    return ()=>{ window.removeEventListener('resize', setOffset); window.removeEventListener('load', setOffset); };
  },[]);

  return (
    <>
      <header className="site-header">
        <div className="header-container">
          <Link to="/">
            <img src="/assets/logo.png" alt="Logo Cooperativa CRAM" className="logo" loading="lazy" />
          </Link>
          <h1>Cooperativa CRAM</h1>

          {/* Dropdown o botón de login */}
          {user ? (
            <div className={"cram-dropdown" + (open ? ' open' : '')} id="userDropdown" ref={wrapRef}>
              <button className="btn-login cram-toggle" type="button" aria-expanded={open ? 'true':'false'} onClick={()=>setOpen(o=>!o)}>
                {user?.name || 'Mi Cuenta'}
                {hasPending && (
                  <span title="Pedidos recibidos pendientes" aria-label="Pedidos recibidos pendientes" style={{display:'inline-block',width:10,height:10,borderRadius:'50%',background:'#fbbf24',marginLeft:6,verticalAlign:'middle',boxShadow:'0 0 0 1px rgba(0,0,0,0.1)'}}></span>
                )}
                <span className="cram-caret" aria-hidden="true"></span>
              </button>
              <div className="cram-menu" role="menu">
                <Link to="/cuenta" onClick={()=>setOpen(false)}>Perfil</Link>
                <Link to="/catalogo" onClick={()=>setOpen(false)}>Hacer pedido</Link>
                {(role === 'soporte') && (
                  <Link to="/admin/usuarios" onClick={()=>setOpen(false)}>Usuarios</Link>
                )}
                {(['trabajador','soporte'].includes(role)) && (
                  <Link to="/admin/orders" onClick={()=>setOpen(false)}>Pedidos (trabajo)</Link>
                )}
                {(role === 'administrador' || role === 'admin_marketing') && (
                  <Link to="/admin/news" onClick={()=>setOpen(false)}>Novedades</Link>
                )}
                {(role === 'administrador') && (
                  <Link to="/admin" onClick={()=>setOpen(false)}>Administración</Link>
                )}
                <button className="cram-link" onClick={()=>{ setOpen(false); logout(); navigate('/'); }}>Cerrar sesión</button>
              </div>
            </div>
          ) : (
            !hideLoginBtn && <Link to="/login" className="btn-login btn-login-standalone">Iniciar Sesión</Link>
          )}
        </div>
      </header>

      {/* Alerta: solo si hay sesión activa y falta email en roles cliente/administrador */}
      {user && !user?.email && (role === 'cliente' || role === 'administrador') && (
        <div className="header-alert-email" style={{background:'#fee2e2',color:'#991b1b',padding:'6px 12px',fontSize:14,fontWeight:500,textAlign:'center',display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
          <span>Te recomendamos registrar tu correo para poder recuperar tu contraseña.</span>
          <Link to="/cuenta" style={{color:'#b91c1c',textDecoration:'underline',fontWeight:600}}>Agregar ahora</Link>
        </div>
      )}
    </>
  );
}
