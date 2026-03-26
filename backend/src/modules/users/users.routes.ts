import { Router } from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middlewares/validate.middleware";
import { createUserSchema, updateUserSchema, userIdSchema } from "./users.schema";
import { getUsers, postUser, putUser, removeUser } from "./users.controller";

export const usersRouter = Router();

usersRouter.use(authMiddleware, requireRole("admin"));
usersRouter.get("/", asyncHandler(getUsers));
usersRouter.post("/", validate(createUserSchema), asyncHandler(postUser));
usersRouter.put("/:userId", validate(updateUserSchema), asyncHandler(putUser));
usersRouter.delete("/:userId", validate(userIdSchema), asyncHandler(removeUser));
