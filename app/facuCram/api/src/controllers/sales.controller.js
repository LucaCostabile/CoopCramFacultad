import { prisma } from "../config/prisma.js";

function toNumber(x) {
  if (x == null) return 0;
  if (typeof x === "bigint") return Number(x);
  const s = x.toString?.() ?? String(x);
  const n = Number(s);
  return Number.isNaN(n) ? 0 : n;
}

function convert(value) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "bigint") return Number(value);
  if (
    value &&
    typeof value === "object" &&
    "d" in value &&
    "e" in value &&
    "s" in value
  ) {
    return parseFloat(value.toString());
  }
  if (Array.isArray(value)) return value.map(convert);
  if (value && typeof value === "object")
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convert(v)]));
  return value;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Dom, 1=Lun
  const diff = (day + 6) % 7; // días desde lunes
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export async function getSales(req, res) {
  try {
    const { period = "", from = "", to = "", page = "1", pageSize = "20" } = req.query || {};

    const now = new Date();
    let rangeFrom = null;
    let rangeTo = null;
    if (period === "today") {
      rangeFrom = startOfDay(now);
      rangeTo = endOfDay(now);
    } else if (period === "week") {
      rangeFrom = startOfWeek(now);
      rangeTo = endOfDay(now);
    } else if (period === "month") {
      rangeFrom = startOfMonth(now);
      rangeTo = endOfDay(now);
    }
    if (from) rangeFrom = startOfDay(from);
    if (to) rangeTo = endOfDay(to);

    const where = {
      status: { in: ["delivered", "completed", "paid"] },
      ...(rangeFrom || rangeTo
        ? { created_at: { ...(rangeFrom ? { gte: rangeFrom } : {}), ...(rangeTo ? { lte: rangeTo } : {}) } }
        : {}),
    };

    const p = Math.max(parseInt(page, 10) || 1, 1);
    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 200);

    // Métricas
    const [count, sumAgg] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.aggregate({ _sum: { total: true }, where }),
    ]);

    const revenue = toNumber(sumAgg?._sum?.total ?? 0);
    const avg_ticket = count > 0 ? revenue / count : 0;

    // Top day con SQL nativo (por fecha)
    let topDayLabel = null;
    let topDayAmount = 0;
    const params = [];
    let sql = `SELECT DATE(created_at) AS day, SUM(total) AS amount
               FROM orders
               WHERE status IN ('delivered','completed','paid')`;
    if (rangeFrom) {
      sql += ` AND created_at >= ?`;
      params.push(rangeFrom);
    }
    if (rangeTo) {
      sql += ` AND created_at <= ?`;
      params.push(rangeTo);
    }
    sql += ` GROUP BY DATE(created_at) ORDER BY amount DESC LIMIT 1`;
    try {
      const rows = await prisma.$queryRawUnsafe(sql, ...params);
      if (rows?.length) {
        topDayLabel = rows[0].day instanceof Date ? rows[0].day.toISOString().slice(0, 10) : String(rows[0].day);
        topDayAmount = toNumber(rows[0].amount);
      }
    } catch (e) {
      // Si falla group by (p.ej. permisos), ignoramos top day
    }

    // Tabla (paginada)
    const [items, totalRows] = await Promise.all([
      prisma.orders.findMany({ where, orderBy: { created_at: "desc" }, skip: (p - 1) * ps, take: ps, select: { id: true, user_id: true, created_at: true, total: true } }),
      prisma.orders.count({ where }),
    ]);

    res.json(
      convert({
        metrics: {
          orders: count,
          revenue,
          avg_ticket,
          top_day_label: topDayLabel,
          top_day_amount: topDayAmount,
        },
        page: p,
        pageSize: ps,
        total: totalRows,
        items,
      })
    );
  } catch (e) {
    res.status(500).json({ error: "Error al obtener ventas", details: String(e?.message || e) });
  }
}
