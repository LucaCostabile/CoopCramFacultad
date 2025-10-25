import { Router } from "express";
import { getSales } from "../controllers/sales.controller.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";

const router = Router();

// Solo administradores
router.get("/", requireAuth, requireRoles(["administrador"]), getSales);

export default router;
