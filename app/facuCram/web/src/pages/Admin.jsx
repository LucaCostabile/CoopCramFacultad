import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Admin() {
  const { user } = useAuth();
  const role = user?.role;
  const canSales = role === "administrador";
  const canOrders = role === "administrador" || role === "soporte";
  return (
    <main className="container" style={{ padding: "16px" }}>
      <h2 className="mb-3" style={{ marginBottom: 12 }}>
        Panel de Administración
      </h2>
      <div className="grid grid-auto">
        <div className="card admin-tile">
          <div className="card-body">
            <h4>Usuarios</h4>
            <p>Gestionar usuarios: crear, editar, inhabilitar.</p>
            <Link className="btn btn-success" to="/admin/usuarios">
              Gestionar
            </Link>
          </div>
        </div>
        {canSales && (
          <div className="card admin-tile">
            <div className="card-body">
              <h4>Pedidos/Ventas</h4>
              <p>Reporte de ventas y pedidos entregados.</p>
              <Link className="btn btn-success" to="/admin/sales">
                Ver ventas
              </Link>
            </div>
          </div>
        )}
        {canOrders && (
          <div className="card admin-tile">
            <div className="card-body">
              <h4>Pedidos de mercadería</h4>
              <p>
                Cola de pedidos para preparar, despachar y marcar entregados
                (pendiente).
              </p>
              <Link className="btn btn-success" to="/admin/orders">
                Ver pedidos
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
