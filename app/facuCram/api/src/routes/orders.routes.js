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

const router = Router();

router.get("/", getOrders); // GET /api/pedidos - Listar todos
router.get("/:id", getOrderById); // GET /api/pedidos/:id - Ver uno
router.get("/:id/details", getOrderByIdWithDetails); // GET /api/pedidos/:id/details - Ver uno con detalles
router.post("/", createOrder); // POST /api/pedidos - Crear
router.patch("/:id/items/:itemId", actualizarCantidadItem); // PATCH /api/pedidos/:id/items/:itemId - Actualizar cantidad de un ítem
router.patch("/:id/status", actualizarEstadoPedido); // PATCH /api/pedidos/:id/status - Actualizar estado
router.delete("/:id", eliminarPedido);; // DELETE /api/pedidos/:id - Eliminar pedido

export default router;
