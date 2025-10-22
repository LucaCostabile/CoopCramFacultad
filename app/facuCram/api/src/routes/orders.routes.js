import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
} from "../controllers/orders.controller.js";

const router = Router();

router.get("/", getOrders); // GET /api/pedidos - Listar todos
router.get("/:id", getOrderById); // GET /api/pedidos/:id - Ver uno
router.post("/", createOrder); // POST /api/pedidos - Crear

export default router;
