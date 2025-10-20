import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import Login from './pages/Login.jsx';
import Account from './pages/Account.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
        <Link to="/">Inicio</Link> |{' '}
        <Link to="/catalogo">Catálogo</Link> |{' '}
        <Link to="/cuenta">Mi cuenta</Link> |{' '}
        <Link to="/admin">Admin</Link>
      </nav>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cuenta" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
