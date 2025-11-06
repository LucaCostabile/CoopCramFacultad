import { useEffect, useState, useCallback } from "react";
import { api } from "../services/api";

export default function Catalog() {
  // Marcar body para estilos específicos del catálogo
  useEffect(() => {
    document.body.classList.add("page-catalogo");
    return () => document.body.classList.remove("page-catalogo");
  }, []);

  // Filtros básicos
  const [filters, setFilters] = useState({ motors: [], rubros: [] });
  const [q, setQ] = useState("");
  const [motor, setMotor] = useState("");
  const [rubro, setRubro] = useState("");
  const [onlyStock, setOnlyStock] = useState(false);

  // Estado de rubros y acordeones
  const [rubrosLista, setRubrosLista] = useState([]);
  const [rubroState, setRubroState] = useState({});
  const [openRubros, setOpenRubros] = useState(new Set());
  const [rubrosVisibles, setRubrosVisibles] = useState(new Set());

  // Carrito y pedido
  const [carrito, setCarrito] = useState({});
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  // Debounce para búsqueda
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Cargar filtros iniciales
  useEffect(() => {
    api
      .get("/catalogo/filters")
      .then((r) => {
        setFilters(r.data);
        setRubrosLista(r.data.rubros || []);
        // Inicialmente todos visibles
        setRubrosVisibles(new Set(r.data.rubros || []));
      })
      .catch((err) => console.error("Error cargando filtros:", err));
  }, []);

  // Construir clave de filtros actual
  const getFilterKey = useCallback(() => {
    return JSON.stringify({ q, motor, rubro, onlyStock });
  }, [q, motor, rubro, onlyStock]);

  // Actualizar visibilidad de rubros según filtros
  const actualizarRubrosVisibles = useCallback(
    async (trigger = "other", rubroOverride = null) => {
      try {
        // Usar rubroOverride si se proporciona, sino usar el estado actual
        const rubroActual = rubroOverride !== null ? rubroOverride : rubro;

        const params = { only_stock: onlyStock ? 1 : 0 };
        if (motor) params.motor = motor;
        if (q.trim()) params.q = q.trim();
        if (rubroActual) params.rubro = rubroActual;

        const res = await api.get("/catalogo/rubro-counts", { params });
        const rows = res.data;
        const rubrosConResultados = new Set(
          rows.filter((r) => (r.total || 0) > 0).map((r) => r.rubro)
        );

        const qEmpty = q.trim() === "";
        const explicitRubroSelected = Boolean(rubroActual);

        // Actualizar rubros visibles
        if (explicitRubroSelected) {
          // Solo mostrar el rubro seleccionado
          setRubrosVisibles(new Set([rubroActual]));
        } else if (qEmpty && !motor) {
          // Sin filtros: mostrar todos
          setRubrosVisibles(new Set(rubrosLista));
        } else {
          // Con filtros: solo rubros con resultados
          setRubrosVisibles(rubrosConResultados);
        }

        // Inicializar estado de rubros que no existan
        const newRubroState = { ...rubroState };
        rubrosLista.forEach((r) => {
          if (!newRubroState[r]) {
            newRubroState[r] = {
              page: 1,
              loaded: false,
              lastPage: 1,
              filterKey: null,
              data: [],
            };
          }
        });
        setRubroState(newRubroState);

        // Lógica de apertura/cierre según trigger
        const newOpenRubros = new Set();

        if (trigger === "stock") {
          // Mantener acordeones abiertos actuales
          openRubros.forEach((r) => {
            if (rubrosConResultados.has(r)) {
              newOpenRubros.add(r);
            }
          });
        } else if (trigger === "rubro") {
          // Abrir solo el rubro seleccionado
          if (rubroActual && rubrosConResultados.has(rubroActual)) {
            newOpenRubros.add(rubroActual);
          }
        } else if (trigger === "motor") {
          // Cerrar todos al cambiar motor
          // No agregar nada a newOpenRubros
        } else if (trigger === "search") {
          // Abrir rubros con resultados si hay búsqueda activa
          if (!qEmpty) {
            rubrosConResultados.forEach((r) => newOpenRubros.add(r));
          }
          // Si se limpió la búsqueda, cerrar todos
        } else {
          // Trigger general: abrir todos con resultados
          rubrosConResultados.forEach((r) => newOpenRubros.add(r));
        }

        setOpenRubros(newOpenRubros);
      } catch (err) {
        console.error("Error actualizando rubros:", err);
      }
    },
    [q, motor, rubro, onlyStock, rubrosLista, rubroState, openRubros]
  );

  // Efecto para búsqueda con debounce
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      actualizarRubrosVisibles("search");
    }, 450);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [q]);

  // Efecto para cambios de motor
  useEffect(() => {
    actualizarRubrosVisibles("motor");
    setOpenRubros(new Set());
  }, [motor]);

  // Efecto para cambios de rubro
  useEffect(() => {
    if (rubro !== "") {
      actualizarRubrosVisibles("rubro", rubro);
    } else {
      // Si se limpió el filtro de rubro, actualizar normalmente
      actualizarRubrosVisibles("other");
    }
  }, [rubro]);

  //  Handler de cambio de rubro (solo cambia el estado)
  const handleRubroChange = (newRubro) => {
    setRubro(newRubro);
    // El useEffect de arriba se encargará de actualizar los rubros visibles
  };

  // Toggle acordeón
  const toggleAccordion = (rubroName) => {
    const newOpen = new Set(openRubros);
    if (newOpen.has(rubroName)) {
      newOpen.delete(rubroName);
    } else {
      newOpen.add(rubroName);
    }
    setOpenRubros(newOpen);
  };

  // Cargar productos de un rubro específico
  const cargarRubro = async (rubroName, page = 1) => {
    try {
      const params = {
        page: String(page),
        per_page: "10",
        rubro: rubroName,
      };
      if (q.trim()) params.q = q.trim();
      if (onlyStock) params.only_stock = 1;
      if (motor) params.motor = motor;

      const res = await api.get("/catalogo", { params });
      const data = res.data;

      setRubroState((prev) => ({
        ...prev,
        [rubroName]: {
          page: data.current_page || page,
          lastPage: data.last_page || 1,
          loaded: true,
          filterKey: getFilterKey(),
          data: data.data || [],
        },
      }));
    } catch (err) {
      console.error(`Error cargando rubro ${rubroName}:`, err);
    }
  };

  // Cargar rubro cuando se abre el acordeón
  useEffect(() => {
    openRubros.forEach((rubroName) => {
      const state = rubroState[rubroName];
      if (!state?.loaded || state?.filterKey !== getFilterKey()) {
        cargarRubro(rubroName, 1);
      }
    });
  }, [openRubros, getFilterKey]);

  // Manejo de cantidad en carrito
  const handleCantidadChange = (code, product, valor) => {
    const qty = Math.min(999, Math.max(0, parseInt(valor || "0", 10)));
    setCarrito((prev) => {
      const newCarrito = { ...prev };
      if (qty > 0) {
        newCarrito[code] = { ...product, cantidad: qty };
      } else {
        delete newCarrito[code];
      }
      return newCarrito;
    });
  };

  // Calcular total del pedido
  const calcularTotal = () => {
    return Object.values(carrito).reduce((sum, item) => {
      return sum + Number(item.price) * item.cantidad;
    }, 0);
  };

  // Enviar pedido
  const enviarPedido = async (e) => {
    e.preventDefault();

    const items = Object.values(carrito);
    if (items.length === 0) {
      alert("Seleccioná al menos un producto.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((i) => ({
          code: i.code,
          quantity: i.cantidad,
        })),
        comment: comentario.trim() || null,
      };

      const res = await api.post("/pedidos", payload);

      if (res.data.ok) {
        alert(`✅ Pedido #${res.data.order_id} registrado correctamente.`);
        setCarrito({});
        setComentario("");
      } else {
        throw new Error("Error en la respuesta del servidor");
      }
    } catch (err) {
      console.error("Error enviando pedido:", err);
      alert("❌ Error al enviar el pedido. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Funciones de scroll
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToBottom = () =>
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

  // Determinar qué rubros mostrar (solo los visibles)
  const rubrosAMostrar = rubrosLista.filter((r) => rubrosVisibles.has(r));

  return (
    <div className="main-catalogo">
      <h1 className="text-2xl font-bold texto">Catálogo de Repuestos - CRAM</h1>

      {/* Búsqueda y Filtros */}
      <div className="busqueda">
        <div id="filtros-container">
          <div className="filtro">
            <input
              type="text"
              className="buscador"
              placeholder="Buscar repuestos..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="filtros-extra">
          <label>
            Marca:
            <select
              id="filtro-motor"
              value={motor}
              onChange={(e) => setMotor(e.target.value)}
            >
              <option value="">Todos</option>
              {filters.motors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rubro:
            <select
              id="filtro-rubro"
              value={rubro}
              onChange={(e) => handleRubroChange(e.target.value)}
            >
              <option value="">Todos</option>
              {filters.rubros.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              id="solo-stock"
              checked={onlyStock}
              onChange={(e) => setOnlyStock(e.target.checked)}
            />{" "}
            Solo en stock
          </label>
        </div>
      </div>

      {/* Catálogo con Acordeones por Rubro */}
      <div id="catalogo">
        {rubrosAMostrar.length === 0 ? (
          <div className="no-results">
            <p>No se encontraron productos con los filtros aplicados.</p>
          </div>
        ) : (
          rubrosAMostrar.map((rubroName) => {
            const isOpen = openRubros.has(rubroName);
            const state = rubroState[rubroName];
            const productos = state?.data || [];
            const currentPage = state?.page || 1;
            const lastPage = state?.lastPage || 1;

            return (
              <div
                key={rubroName}
                className={`accordion ${isOpen ? "active" : ""}`}
                data-rubro={rubroName}
              >
                <div
                  className="accordion-header"
                  onClick={() => toggleAccordion(rubroName)}
                >
                  {rubroName}
                </div>

                {isOpen && (
                  <div className="accordion-content">
                    <div className="rubro-items">
                      {productos.length > 0 ? (
                        <table className="tabla-rubro">
                          <thead>
                            <tr>
                              <th>Código</th>
                              <th>N° Fábrica</th>
                              <th>Artículo</th>
                              <th>Inf. Técnica</th>
                              <th>Precio</th>
                              <th>Stock</th>
                              <th>Cantidad</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productos.map((p) => (
                              <tr key={p.code}>
                                <td data-label="Código">
                                  <span className="cell-label">Código</span>
                                  <span className="cell-value">
                                    {p.code || ""}
                                  </span>
                                </td>
                                <td data-label="N° Fábrica">
                                  <span className="cell-label">N° Fábrica</span>
                                  <span className="cell-value">
                                    {p.nro_fabrica || ""}
                                  </span>
                                </td>
                                <td data-label="Artículo">
                                  <span className="cell-label">Artículo</span>
                                  <span className="cell-value">
                                    <strong>
                                      {p.articulo || "(sin datos)"}
                                    </strong>
                                  </span>
                                </td>
                                <td data-label="Inf. Técnica">
                                  <span className="cell-label">
                                    Inf. Técnica
                                  </span>
                                  <span className="cell-value">
                                    {p.info_tecnica || ""}
                                  </span>
                                </td>
                                <td data-label="Precio">
                                  <span className="cell-label">Precio</span>
                                  <span className="cell-value">
                                    ${Number(p.price).toFixed(2)}
                                  </span>
                                </td>
                                <td data-label="Stock">
                                  <span className="cell-label">Stock</span>
                                  <span className="cell-value">
                                    {p.stock || ""}
                                  </span>
                                </td>
                                <td data-label="Cantidad">
                                  <span className="cell-label">Cantidad</span>
                                  <span className="cell-value">
                                    <input
                                      type="number"
                                      min="0"
                                      max="999"
                                      step="1"
                                      placeholder="0"
                                      inputMode="numeric"
                                      className="cantidad-input"
                                      disabled={!p.in_stock}
                                      value={carrito[p.code]?.cantidad || ""}
                                      onChange={(e) =>
                                        handleCantidadChange(
                                          p.code,
                                          p,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p>No hay productos disponibles.</p>
                      )}
                    </div>

                    {/* Paginación */}
                    {lastPage > 1 && (
                      <div className="pager">
                        <button
                          className="prev"
                          disabled={currentPage <= 1}
                          onClick={() =>
                            cargarRubro(rubroName, currentPage - 1)
                          }
                        >
                          Anterior
                        </button>
                        <span className="page-info">
                          Página {currentPage} de {lastPage}
                        </span>
                        <button
                          className="next"
                          disabled={currentPage >= lastPage}
                          onClick={() =>
                            cargarRubro(rubroName, currentPage + 1)
                          }
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Botones de Scroll */}
      <div id="scroll-buttons" aria-label="Navegación rápida">
        <button
          type="button"
          id="scroll-top"
          title="Ir al inicio"
          onClick={scrollToTop}
        >
          ▲ Inicio
        </button>
        <button
          type="button"
          id="scroll-bottom"
          title="Ir al final"
          onClick={scrollToBottom}
        >
          ▼ Final
        </button>
      </div>

      {/* Carrito */}
      <section className="carrito">
        <h2>🛒 Repuestos Seleccionados</h2>
        <div id="pedidoResumen">
          {Object.keys(carrito).length === 0 ? (
            <p>No hay repuestos seleccionados.</p>
          ) : (
            <ul>
              {Object.values(carrito).map((item) => {
                const subtotal = Number(item.price) * item.cantidad;
                return (
                  <li key={item.code}>
                    <strong>{item.articulo}</strong> - Cantidad: {item.cantidad}{" "}
                    - Subtotal: ${subtotal.toFixed(2)}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <p>
          <strong>Total:</strong>{" "}
          <span id="totalPedido">${calcularTotal().toFixed(2)}</span>
        </p>
      </section>

      {/* Formulario de Pedido */}
      <section className="formulario-carrito">
        <h2>Enviar Pedido</h2>
        <form id="form-pedido" onSubmit={enviarPedido}>
          <label htmlFor="comentario">Comentario (opcional):</label>
          <textarea
            name="comentario"
            rows="4"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || Object.keys(carrito).length === 0}
          >
            {loading ? "Enviando..." : "Enviar Pedido"}
          </button>
        </form>
      </section>
    </div>
  );
}
