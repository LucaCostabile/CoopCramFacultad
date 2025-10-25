import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editandoItem, setEditandoItem] = useState(null);
  const [cantidadTemp, setCantidadTemp] = useState({});

  useEffect(() => {
    cargarPedido();
  }, [id]);

  const cargarPedido = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/pedidos/${id}/details`);
      setPedido(response.data);
      setError(null);
    } catch (err) {
      console.error("❌ Error al cargar pedido:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const actualizarCantidad = async (itemId) => {
    const nuevaCantidad = parseInt(cantidadTemp[itemId], 10);
    
    if (!nuevaCantidad || nuevaCantidad < 1) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      const response = await api.patch(`/pedidos/${id}/items/${itemId}`, {
        quantity: nuevaCantidad,
      });

      if (response.data.ok) {
        await cargarPedido();
        setEditandoItem(null);
        setCantidadTemp({});
        alert("Cantidad actualizada correctamente");
      }
    } catch (err) {
      console.error("❌ Error al actualizar cantidad:", err);
      const errorMsg = err.response?.data?.message || "Error al actualizar la cantidad";
      alert(errorMsg);
    }
  };

  const iniciarEdicion = (item) => {
    setEditandoItem(item.id);
    setCantidadTemp({ ...cantidadTemp, [item.id]: item.quantity });
  };

  const cancelarEdicion = () => {
    setEditandoItem(null);
    setCantidadTemp({});
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "40px", textAlign: "center" }}>
        ⏳ Cargando pedido...
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="container" style={{ padding: "40px" }}>
        <div style={{ color: "red", marginBottom: "20px" }}>
          <h2>❌ Error:</h2>
          <p>{error || "No se encontró el pedido"}</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate("/admin/orders")}>
          Volver a pedidos
        </button>
      </div>
    );
  }

  return (
  <div className="container">
    {/* Header para pantalla - solo visible en pantalla */}
    <div className="detalle-pedido-header no-print">
      <h1>
        Productos del pedido de {pedido.client_name || `Cliente ${pedido.user_id}`} #{pedido.id}
      </h1>
      <div style={{ display: "flex", gap: "10px" }}>
        <button className="btn btn-outline" onClick={() => navigate("/admin/orders")}>
          Volver
        </button>
        <button className="btn btn-primary" onClick={handleImprimir}>
          Imprimir
        </button>
      </div>
    </div>

    {/* Header para impresión - solo visible al imprimir */}
    

    <div className="detalle-pedido-body">
        {pedido.comment && (
          <div className="comentario-box">
            <p className="no-print"><strong>Comentario:</strong> {pedido.comment}</p>
            <div className="comentario-highlight">
              <p><strong>Comentario del pedido:</strong> {pedido.comment}</p>
            </div>
          </div>
        )}

        {pedido.items && pedido.items.length > 0 ? (
          <table className="tabla-productos-pedido">
            <thead>
              <tr>
                <th>Código</th>
                <th>Artículo</th>
                <th>Inf. Técnica</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_code}</td>
                  <td>{item.product_name || "N/A"}</td>
                  <td>{item.product_info || ""}</td>
                  <td>
                    {editandoItem === item.id ? (
                      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <input 
                          type="number"
                          min="1"
                          value={cantidadTemp[item.id] || item.quantity}
                          onChange={(e) => setCantidadTemp({
                            ...cantidadTemp,
                            [item.id]: parseInt(e.target.value, 10) || 0
                          })}
                          className="cantidad-edit"
                          autoFocus
                        />
                        <button 
                          className="btn-guardar-item"
                          onClick={() => actualizarCantidad(item.id)}
                          title="Guardar cambios"
                        >
                          ✓
                        </button>
                        <button 
                          className="btn-cancelar-item no-print"
                          onClick={cancelarEdicion}
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                        <span style={{ 
                          padding: "6px 8px",
                          minWidth: "60px",
                          textAlign: "center",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          backgroundColor: "#f8f9fa",
                          display: "inline-block"
                        }}>
                          {item.quantity}
                        </span>
                        <button 
                          className="btn-guardar-item no-print"
                          onClick={() => iniciarEdicion(item)}
                          title="Editar cantidad"
                        >
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                  <td>${Number(item.unit_price).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</td>
                  <td>${Number(item.subtotal).toLocaleString('es-AR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No hay items en este pedido</p>
        )}

        <div className="total-pedido">
          <strong>Total: ${Number(pedido.total).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}</strong>
        </div>
      </div>
    </div>
  );
}