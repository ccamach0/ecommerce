import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middlewares/validate.middleware";
import { getBilling, putBilling } from "./billing.controller";
import { billingSettingsSchema } from "./billing.schema";

export const billingRouter = Router();

billingRouter.use(authMiddleware, requireRole("admin"));
billingRouter.get("/settings", asyncHandler(getBilling));
billingRouter.put("/settings", validate(billingSettingsSchema), asyncHandler(putBilling));
