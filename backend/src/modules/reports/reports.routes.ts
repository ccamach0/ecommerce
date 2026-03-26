import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { getDashboard } from "./reports.controller";

export const reportsRouter = Router();

reportsRouter.get("/dashboard", authMiddleware, requireRole("admin"), asyncHandler(getDashboard));
