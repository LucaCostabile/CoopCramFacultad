import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function fmtMoney(n) {
  try {
    return (n ?? 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });
  } catch {
    const x = Number(n ?? 0).toFixed(2).replace(".", ",");
    return "$" + x;
  }
}

function fmtDate(d) {
  try {
    const x = new Date(d);
    return x.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return String(d ?? "");
  }
}

export default function AdminSales() {
  const [period, setPeriod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({ orders: 0, revenue: 0, avg_ticket: 0, top_day_label: null, top_day_amount: 0 });
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / pageSize), 1), [total, pageSize]);

  async function load(resetPage = false) {
    try {
      setLoading(true);
      setError("");
      const params = { period, from, to, page: resetPage ? 1 : page, pageSize };
      const r = await api.get("/sales", { params });
      setMetrics(r.data?.metrics || {});
      setItems(r.data?.items || []);
      setTotal(r.data?.total || 0);
      if (resetPage) setPage(1);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e) {
    e.preventDefault();
    load(true);
  }

  function clearFilters() {
    setPeriod("");
    setFrom("");
    setTo("");
    setPage(1);
    load(true);
  }

  useEffect(() => {
    if (page > 1) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <main className="container py-4" style={{ fontSize: "1rem" }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Ventas</h3>
        <form className="row gx-2 gy-2 align-items-end" onSubmit={onSubmit}>
          <div className="col-auto">
            <label className="form-label mb-1">Periodo</label>
            <select name="period" className="form-select form-select-sm" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">—</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
          </div>
          <div className="col-auto">
            <label className="form-label mb-1">Desde</label>
            <input type="date" name="from" className="form-control form-control-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="col-auto">
            <label className="form-label mb-1">Hasta</label>
            <input type="date" name="to" className="form-control form-control-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="col-auto">
            <button className="btn btn-success btn-sm" type="submit" disabled={loading}>
              {loading ? "Cargando..." : "Aplicar"}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm ms-2" onClick={clearFilters} disabled={loading}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100" style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--accent-100)" }}>
            <div className="card-body">
              <div className="text-muted small">Pedidos</div>
              <div className="h4 mb-0">{metrics?.orders ?? 0}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100" style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--accent-100)" }}>
            <div className="card-body">
              <div className="text-muted small">Ingresos</div>
              <div className="h4 mb-0">{fmtMoney(metrics?.revenue ?? 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100" style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--accent-100)" }}>
            <div className="card-body">
              <div className="text-muted small">Ticket promedio</div>
              <div className="h4 mb-0">{fmtMoney(metrics?.avg_ticket ?? 0)}</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-lg-3">
          <div className="card h-100" style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--accent-100)" }}>
            <div className="card-body">
              <div className="text-muted small">Mejor día</div>
              <div className="h6 mb-0">{metrics?.top_day_label ?? "—"}</div>
              <div className="small text-muted">{fmtMoney(metrics?.top_day_amount ?? 0)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  {loading ? "Cargando..." : "Sin resultados"}
                </td>
              </tr>
            )}
            {items.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.user_id || "—"}</td>
                <td>{fmtDate(o.created_at)}</td>
                <td className="align-middle">{fmtMoney(o.total)}</td>
                <td className="align-middle">
                  <a className="btn btn-sm btn-outline-primary" href="/admin/orders" onClick={(e) => { /* se podría navegar con router */ }}>
                    Ver productos
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="text-muted small">
          Página {page} de {totalPages} — {total} resultados
        </div>
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(p - 1, 1))}>
            Anterior
          </button>
          <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>
            Siguiente
          </button>
        </div>
      </div>
    </main>
  );
}
