// src/controllers/orders.controller.js
import { prisma } from "../config/prisma.js";

/**
 * Convierte BigInt y Decimal a tipos serializables
 */
function convertBigInt(value) {
  if (typeof value === "bigint") {
    return Number(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (
    value !== null &&
    typeof value === "object" &&
    "d" in value &&
    "e" in value &&
    "s" in value
  ) {
    return parseFloat(value.toString());
  }
  if (Array.isArray(value)) {
    return value.map(convertBigInt);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, convertBigInt(v)])
    );
  }
  return value;
}

/**
 * Obtener todos los pedidos con sus items
 * (Volvemos a la versión original N+1 para evitar el error 500)
 */
export async function getOrders(req, res, next) {
  try {
    console.log("📦 Obteniendo pedidos (versión N+1 temporal)...");

    const orders = await prisma.orders.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    console.log(`✅ ${orders.length} pedidos encontrados en DB`);

    // Obtener items para cada pedido (esto es lento pero funciona)
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        // Tu código original para crear pedidos usa 'order_items', así que esto debería funcionar.
        const items = await prisma.order_items.findMany({
          where: {
            order_id: order.id,
          },
        });

        return {
          ...order,
          items, // El frontend 'Orders.jsx' espera un array 'items'
        };
      })
    );

    const response = convertBigInt(ordersWithItems);
    console.log("📤 Enviando respuesta con", response.length, "pedidos");

    res.json(response);
  } catch (err) {
    console.error("❌ Error en getOrders (N+1):", err);
    res
      .status(500)
      .json({ error: "Error al obtener pedidos", details: err.message });
  }
}

/**
 * Obtener un pedido específico por ID
 * (Volvemos a la versión original N+1)
 */
export async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.orders.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!order) {
      return res.status(404).json({
        error: "Pedido no encontrado",
      });
    }

    const items = await prisma.order_items.findMany({
      where: {
        order_id: BigInt(id),
      },
    });

    const response = convertBigInt({
      ...order,
      items,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Error en getOrderById:", err);
    res
      .status(500)
      .json({ error: "Error al obtener pedido", details: err.message });
  }
}

/**
 * Crear nuevo pedido
 * (Tu función original, solo se quitó la '}' extra al final)
 */
export async function createOrder(req, res, next) {
  try {
    console.log("📝 Creando nuevo pedido...");
    const { items, comment } = req.body || {};

    // Validar que items existe y es un array con al menos 1 elemento
    if (!Array.isArray(items) || items.length < 1) {
      return res.status(422).json({
        error: "items requerido (array con al menos 1 ítem)",
      });
    }

    // Validar cada item
    for (const it of items) {
      if (!it?.code || !Number.isInteger(it?.quantity) || it.quantity < 1) {
        return res.status(422).json({
          error: "Cada item requiere code (string) y quantity (número >= 1)",
        });
      }
    }

    // Obtener productos por code
    const codes = items.map((i) => i.code);
    const products = await prisma.products.findMany({
      where: {
        code: { in: codes },
        is_active: true,
      },
    });

    const map = new Map(products.map((p) => [p.code, p]));

    // Calcular totales y preparar items de la orden
    let total = 0;
    const orderItemsData = [];

    for (const it of items) {
      const p = map.get(it.code);
      if (!p) {
        return res.status(422).json({
          error: `Producto no encontrado o inactivo: ${it.code}`,
        });
      }

      const unit = Number(p.price);
      const qty = Number(it.quantity);
      const subtotal = unit * qty;
      total += subtotal;

      orderItemsData.push({
        product_code: p.code,
        product_id: p.id,
        quantity: qty,
        unit_price: unit,
        subtotal,
      });
    }

    // Crear orden y sus items en una transacción
    const created = await prisma.$transaction(async (tx) => {
      // Obtener userId si existe autenticación, sino null
      const userId = req.user?.sub || req.user?.id || null;

      // Crear la orden
      const order = await tx.orders.create({
        data: {
          user_id: userId,
          status: "pending",
          total,
          comment: comment?.trim() || null,
        },
      });

      // Crear los items de la orden
      for (const oi of orderItemsData) {
        await tx.order_items.create({
          data: {
            ...oi,
            order_id: order.id,
          },
        });
      }

      return order;
    });

    console.log("✅ Pedido creado:", created.id);

    // Convertir BigInt a Number antes de enviar la respuesta
    const response = convertBigInt({
      ok: true,
      order_id: created.id,
      total: created.total,
      status: created.status,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Error en createOrder:", err);
    res
      .status(500)
      .json({ error: "Error al crear pedido", details: err.message });
  }
}

// NOTA: Se eliminó la llave '}' extra que estaba aquí y causaba el SyntaxError
