import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Login from "./pages/Login.jsx";
import CreatePassword from "./pages/CreatePassword.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminUserCreate from "./pages/AdminUserCreate.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import OrdersDebug from "./pages/Orders.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const role = user?.role;
  return (
    <div>
      <nav
        className="topbar"
        style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}
      >
        <span className="brand">Cooperativa CRAM</span>
        <div className="nav">
          <Link to="/">Inicio</Link>
          <Link to="/catalogo">Catálogo</Link>
          {user && <Link to="/cuenta">Mi cuenta</Link>}
          {(role === "administrador" || role === "soporte") && (
            <Link to="/admin">Admin</Link>
          )}
        </div>
        <div style={{ marginLeft: "auto" }}>
          {!user ? (
            <Link to="/login">Iniciar sesión</Link>
          ) : (
            <button onClick={logout}>Salir</button>
          )}
        </div>
      </nav>
      <main style={{ padding: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crear-contrasena" element={<CreatePassword />} />
          <Route
            path="/cuenta"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["administrador", "soporte"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute roles={["administrador", "soporte"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/usuarios/crear"
            element={
              <ProtectedRoute roles={["administrador", "soporte"]}>
                <AdminUserCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute roles={["administrador", "soporte"]}>
                <OrdersDebug />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
