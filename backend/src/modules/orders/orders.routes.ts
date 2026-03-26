import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getOrders, postPosOrder } from "./orders.controller";
import { validate } from "../../middlewares/validate.middleware";
import { posOrderSchema } from "./orders.schema";

export const ordersRouter = Router();

ordersRouter.get("/", authMiddleware, asyncHandler(getOrders));
ordersRouter.post("/pos", authMiddleware, requireRole("admin", "cashier"), validate(posOrderSchema), asyncHandler(postPosOrder));
