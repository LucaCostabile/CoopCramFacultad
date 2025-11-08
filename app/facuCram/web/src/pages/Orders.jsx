import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Agregar
import { api } from "../services/api";

export default function OrdersDebug() {
  const navigate = useNavigate(); // ✅ Agregar
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarEntregados, setMostrarEntregados] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/pedidos");
      console.log("📦 Pedidos recibidos:", response.data); // 👈 AGREGAR
      console.log("📅 Primera fecha:", response.data[0]?.created_at); // 👈 AGREGAR
      setPedidos(response.data);
      setError(null);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      const response = await api.patch(`/pedidos/${pedidoId}/status`, {
        status: nuevoEstado,
      });

      if (response.data.ok) {
        setPedidos(
          pedidos.map((p) =>
            p.id === pedidoId ? { ...p, status: nuevoEstado } : p
          )
        );
      }
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      alert("Error al actualizar el estado del pedido");
    }
  };

  const borrarPedido = async (pedidoId) => {
    if (!confirm(`¿Estás seguro de borrar el pedido #${pedidoId}?`)) {
      return;
    }

    try {
      const response = await api.delete(`/pedidos/${pedidoId}`);

      if (response.data.ok) {
        setPedidos(pedidos.filter((p) => p.id !== pedidoId));
        alert("Pedido eliminado correctamente");
      }
    } catch (err) {
      console.error("❌ Error al borrar pedido:", err);
      alert("Error al borrar el pedido");
    }
  };

  // ✅ Nueva función para navegar
  const verProductos = (pedidoId) => {
    navigate(`/admin/orders/${pedidoId}`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pedidosFiltrados = mostrarEntregados
    ? pedidos.filter((p) => p.status === "delivered")
    : pedidos.filter((p) => p.status !== "delivered");

  if (loading) {
    return (
      <div
        className="container"
        style={{ padding: "40px", textAlign: "center" }}
      >
        ⏳ Cargando pedidos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: "40px" }}>
        <div style={{ color: "red", marginBottom: "20px" }}>
          <h2>❌ Error:</h2>
          <p>{error}</p>
        </div>
        <button className="btn btn-primary" onClick={cargarPedidos}>
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          {mostrarEntregados ? "Pedidos entregados" : "Pedidos en curso"}
        </h1>
        <button
          className="btn btn-outline"
          onClick={() => setMostrarEntregados(!mostrarEntregados)}
        >
          {mostrarEntregados ? "Volver a en curso" : "Ver entregados"}
        </button>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="card">
          <div
            className="card-body"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <p>
              No hay pedidos {mostrarEntregados ? "entregados" : "en curso"}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tabla-pedidos">
            <thead>
              <tr>
                <th># Orden</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                {!mostrarEntregados && <th>Estado</th>}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{pedido.id}</td>
                  <td>
                    {pedido.client_name || pedido.user_id || "Sin cliente"}
                  </td>
                  <td>{formatearFecha(pedido.created_at)}</td>
                  <td>
                    $
                    {Number(pedido.total).toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  {!mostrarEntregados && (
                    <td>
                      <select
                        value={pedido.status}
                        onChange={(e) =>
                          cambiarEstado(pedido.id, e.target.value)
                        }
                        className="estado-select"
                      >
                        <option value="pending">Recibido</option>
                        <option value="preparing">Preparado</option>
                        <option value="delivered">Entregado</option>
                      </select>
                    </td>
                  )}
                  <td>
                    <div className="acciones-grupo">
                      <button
                        className="btn-accion btn-ver"
                        onClick={() => verProductos(pedido.id)} // ✅ Cambiar a navigate
                      >
                        Ver productos
                      </button>
                      {mostrarEntregados && (
                        <>
                          <button
                            className="btn-accion btn-preparado"
                            onClick={() =>
                              cambiarEstado(pedido.id, "preparing")
                            }
                          >
                            Volver a preparado
                          </button>
                          <button
                            className="btn-accion btn-recibido"
                            onClick={() => cambiarEstado(pedido.id, "pending")}
                          >
                            Volver a recibido
                          </button>
                        </>
                      )}
                      <button
                        className="btn-accion btn-borrar"
                        onClick={() => borrarPedido(pedido.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
