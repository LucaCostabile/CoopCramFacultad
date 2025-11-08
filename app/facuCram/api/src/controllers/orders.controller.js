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
 * Obtener todos los pedidos con información del cliente
 */
export async function getOrders(req, res, next) {
  try {
    console.log("📦 Obteniendo pedidos...");

    const orders = await prisma.orders.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    console.log(`✅ ${orders.length} pedidos encontrados en DB`);

    // Obtener items y datos del usuario para cada pedido
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const items = await prisma.order_items.findMany({
          where: {
            order_id: order.id,
          },
        });

        // Obtener información del cliente si existe user_id
        let client_name = "Sin cliente";

        if (order.user_id) {
          try {
            const user = await prisma.users.findUnique({
              where: { id: order.user_id },
              select: { name: true },
            });
            client_name = user?.name || `Usuario ${order.user_id}`;
          } catch (err) {
            console.error(`Error obteniendo usuario ${order.user_id}:`, err);
            client_name = `Usuario ${order.user_id}`;
          }
        }

        return {
          ...order,
          client_name,
          items,
        };
      })
    );

    const response = convertBigInt(ordersWithDetails);
    console.log("📤 Enviando respuesta con", response.length, "pedidos");

    res.json(response);
  } catch (err) {
    console.error("❌ Error en getOrders:", err);
    res
      .status(500)
      .json({ error: "Error al obtener pedidos", details: err.message });
  }
}

/**
 * Obtener un pedido específico por ID
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

    // Obtener nombre del cliente
    let client_name = "Sin cliente";

    if (order.user_id) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: order.user_id },
          select: { name: true },
        });
        client_name = user?.name || `Usuario ${order.user_id}`;
      } catch (err) {
        console.error(`Error obteniendo usuario ${order.user_id}:`, err);
        client_name = `Usuario ${order.user_id}`;
      }
    }

    const response = convertBigInt({
      ...order,
      client_name,
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
 * Crear nuevo pedido - VERSIÓN CON AUTENTICACIÓN REAL
 */
export async function createOrder(req, res, next) {
  try {
    console.log("🆕 Creando nuevo pedido...");
    console.log("📝 Body recibido:", JSON.stringify(req.body, null, 2));
    console.log("👤 Usuario autenticado (req.user):", req.user);

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

    // Crear pedido y sus items en una transacción
    const created = await prisma.$transaction(async (tx) => {
      // Obtener userId del token JWT (viene en req.user gracias a requireAuth)
      let userId = null;

      if (req.user) {
        // El payload del JWT puede tener diferentes estructuras
        userId = req.user.sub || req.user.id || req.user.userId || null;
        console.log("✅ Usuario extraído del token:", userId);
      } else {
        console.log(
          "⚠️ No hay req.user - el middleware requireAuth no se ejecutó"
        );
      }

      console.log("📝 Creando pedido con:", {
        user_id: userId,
        total,
        items: orderItemsData.length,
      });

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

    const response = convertBigInt({
      ok: true,
      order_id: created.id,
      total: created.total,
      status: created.status,
      user_id: created.user_id,
    });

    res.json(response);
  } catch (err) {
    console.error("❌ Error en createOrder:", err);
    res
      .status(500)
      .json({ error: "Error al crear pedido", details: err.message });
  }
}

/**
 * Actualizar el estado de un pedido
 */
export const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const estadosValidos = ["pending", "preparing", "delivered"];
  if (!estadosValidos.includes(status)) {
    return res.status(400).json({ ok: false, message: "Estado inválido" });
  }

  try {
    const pedido = await prisma.orders.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    const response = convertBigInt({
      ok: true,
      pedido,
    });

    return res.json(response);
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    return res.status(500).json({ ok: false, message: "Error interno" });
  }
};

/**
 * Eliminar un pedido
 */
export const eliminarPedido = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`🗑️ Eliminando pedido ${id}...`);

    await prisma.$transaction(async (tx) => {
      await tx.order_items.deleteMany({
        where: { order_id: BigInt(id) },
      });

      await tx.orders.delete({
        where: { id: BigInt(id) },
      });
    });

    console.log(`✅ Pedido ${id} eliminado correctamente`);
    return res.json({ ok: true, message: "Pedido eliminado" });
  } catch (error) {
    console.error("❌ Error al eliminar pedido:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al eliminar pedido" });
  }
};

/**
 * Obtener pedido con detalles completos de productos
 */
export async function getOrderByIdWithDetails(req, res, next) {
  try {
    const { id } = req.params;
    console.log(`📦 Obteniendo pedido ${id} con detalles...`);

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

    // Obtener items del pedido
    const items = await prisma.order_items.findMany({
      where: {
        order_id: BigInt(id),
      },
    });

    // Obtener información completa de cada producto
    const itemsWithProductInfo = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.products.findUnique({
          where: { id: item.product_id },
        });

        return {
          ...item,
          product_name: product?.articulo || "N/A",
          product_info: product?.info_tecnica || "",
        };
      })
    );

    // Obtener nombre del cliente
    let client_name = "Sin cliente";

    if (order.user_id) {
      try {
        const user = await prisma.users.findUnique({
          where: { id: order.user_id },
          select: { name: true },
        });
        client_name = user?.name || `Usuario ${order.user_id}`;
      } catch (err) {
        console.error(`Error obteniendo usuario ${order.user_id}:`, err);
        client_name = `Usuario ${order.user_id}`;
      }
    }

    const response = convertBigInt({
      ...order,
      client_name,
      items: itemsWithProductInfo,
    });

    console.log("✅ Pedido obtenido con información completa");
    res.json(response);
  } catch (err) {
    console.error("❌ Error en getOrderByIdWithDetails:", err);
    res
      .status(500)
      .json({ error: "Error al obtener pedido", details: err.message });
  }
}

/**
 * Actualizar la cantidad de un item del pedido
 */
export const actualizarCantidadItem = async (req, res) => {
  const { id, itemId } = req.params;
  const { quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      ok: false,
      message: "La cantidad debe ser un número mayor a 0",
    });
  }

  try {
    console.log(`🔄 Actualizando item ${itemId} del pedido ${id}...`);

    // Obtener el item actual
    const item = await prisma.order_items.findFirst({
      where: {
        id: BigInt(itemId),
        order_id: BigInt(id),
      },
    });

    if (!item) {
      return res.status(404).json({
        ok: false,
        message: "Item no encontrado",
      });
    }

    // Validar stock del producto
    const product = await prisma.products.findUnique({
      where: { id: item.product_id },
    });

    if (!product) {
      return res.status(404).json({
        ok: false,
        message: "Producto no encontrado",
      });
    }

    // Verificar si hay stock suficiente
    if (product.stock && Number(product.stock) < quantity) {
      return res.status(400).json({
        ok: false,
        message: `Stock insuficiente. Stock disponible: ${product.stock}`,
      });
    }

    // Verificar si el producto está activo y en stock
    if (!product.is_active) {
      return res.status(400).json({
        ok: false,
        message: "El producto está inactivo",
      });
    }

    if (!product.in_stock) {
      return res.status(400).json({
        ok: false,
        message: "El producto no tiene stock disponible",
      });
    }

    // Calcular nuevo subtotal
    const unit_price = Number(item.unit_price);
    const subtotal = unit_price * quantity;

    // Actualizar el item
    await prisma.order_items.update({
      where: { id: BigInt(itemId) },
      data: {
        quantity,
        subtotal,
      },
    });

    // Recalcular el total del pedido
    const allItems = await prisma.order_items.findMany({
      where: { order_id: BigInt(id) },
    });

    const newTotal = allItems.reduce((sum, it) => {
      const itemSubtotal =
        it.id === BigInt(itemId) ? subtotal : Number(it.subtotal);
      return sum + itemSubtotal;
    }, 0);

    // Actualizar el total del pedido
    await prisma.orders.update({
      where: { id: BigInt(id) },
      data: { total: newTotal },
    });

    console.log("✅ Cantidad actualizada correctamente");

    const response = convertBigInt({
      ok: true,
      item: {
        id: itemId,
        quantity,
        subtotal,
      },
      orderTotal: newTotal,
    });

    return res.json(response);
  } catch (error) {
    console.error("❌ Error al actualizar cantidad:", error);
    return res.status(500).json({
      ok: false,
      message: "Error al actualizar cantidad",
    });
  }
};
