import { Router } from "express";
import { login, me } from "./auth.controller";
import { validate } from "../../middlewares/validate.middleware";
import { loginSchema } from "./auth.schema";
import { asyncHandler } from "../../utils/async-handler";
import { authMiddleware } from "../../middlewares/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), asyncHandler(login));
authRouter.get("/me", authMiddleware, asyncHandler(me));
