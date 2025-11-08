import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  actualizarEstadoPedido,
  eliminarPedido,
  getOrderByIdWithDetails,
  actualizarCantidadItem,
} from "../controllers/orders.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.get("/:id/details", getOrderByIdWithDetails);

// Con autenticación real (obtiene usuario del token JWT)
router.post("/", requireAuth, createOrder); // 👈 USAR requireAuth

// OPCIÓN 2: Sin autenticación (el nombre viene en el body)
// router.post("/", createOrder);

router.patch("/:id/items/:itemId", actualizarCantidadItem);
router.patch("/:id/status", actualizarEstadoPedido);
router.delete("/:id", eliminarPedido);

export default router;
