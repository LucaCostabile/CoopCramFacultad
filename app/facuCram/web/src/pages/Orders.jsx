import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function OrdersDebug() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      console.log("🔄 Iniciando carga de pedidos...");

      const response = await api.get("/pedidos");

      console.log("✅ Respuesta completa:", response);
      console.log("📦 Data recibida:", response.data);
      console.log("📊 Cantidad de pedidos:", response.data?.length);

      setPedidos(response.data);
      setError(null);
    } catch (err) {
      console.error("❌ Error completo:", err);
      console.error("❌ Error response:", err.response);
      console.error("❌ Error data:", err.response?.data);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>⏳ Cargando pedidos...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>❌ Error:</h2>
        <p>{error}</p>
        <button onClick={cargarPedidos}>🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📋 Pedidos Registrados (Debug)</h1>
      <button onClick={cargarPedidos} style={{ marginBottom: "20px" }}>
        🔄 Actualizar
      </button>

      <p>
        <strong>Total de pedidos:</strong> {pedidos.length}
      </p>

      <hr />

      {pedidos.length === 0 ? (
        <p>No hay pedidos registrados</p>
      ) : (
        <div>
          {pedidos.map((pedido, index) => (
            <div
              key={pedido.id || index}
              style={{
                border: "1px solid #ccc",
                padding: "15px",
                marginBottom: "15px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3>Pedido #{pedido.id}</h3>
              <p>
                <strong>Estado:</strong> {pedido.status}
              </p>
              <p>
                <strong>Total:</strong> ${pedido.total}
              </p>
              <p>
                <strong>Usuario:</strong> {pedido.user_id || "Sin usuario"}
              </p>
              <p>
                <strong>Fecha:</strong> {pedido.created_at}
              </p>
              <p>
                <strong>Comentario:</strong>{" "}
                {pedido.comment || "Sin comentario"}
              </p>

              <h4>Items ({pedido.items?.length || 0}):</h4>
              {pedido.items && pedido.items.length > 0 ? (
                <ul>
                  {pedido.items.map((item, idx) => (
                    <li key={item.id || idx}>
                      Código: {item.product_code} | Cantidad: {item.quantity} |
                      Precio: ${item.unit_price} | Subtotal: ${item.subtotal}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay items</p>
              )}

              <hr />
              <details>
                <summary>Ver JSON completo</summary>
                <pre
                  style={{
                    backgroundColor: "#eee",
                    padding: "10px",
                    overflow: "auto",
                    fontSize: "12px",
                  }}
                >
                  {JSON.stringify(pedido, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
