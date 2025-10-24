import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Catalog from "./pages/Catalog.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import CreatePassword from "./pages/CreatePassword.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminUserCreate from "./pages/AdminUserCreate.jsx";
import AdminSales from "./pages/AdminSales.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import OrdersDebug from "./pages/Orders.jsx";
import Header from "./components/Header.jsx";
import NewsManage from "./pages/NewsManage.jsx";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/login" element={<Login />} />
          <Route path="/olvide-contrasena" element={<ForgotPassword />} />
          <Route path="/restablecer-contrasena" element={<ResetPassword />} />
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
            path="/admin/sales"
            element={
              <ProtectedRoute roles={["administrador"]}>
                <AdminSales />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/news"
            element={
              <ProtectedRoute roles={["administrador", "admin_marketing"]}>
                <NewsManage />
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
              <ProtectedRoute roles={["administrador", "soporte", "trabajador"]}>
                <OrdersDebug />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer>
        <p>&copy; {new Date().getFullYear()} Cooperativa CRAM. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
