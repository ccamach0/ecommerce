import { Router } from "express";
import {
  getAdminProducts,
  getProductMeta,
  getProducts,
  postProduct,
  putProduct,
  removeProduct
} from "./products.controller";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";
import { validate } from "../../middlewares/validate.middleware";
import { productIdSchema } from "./products.schema";
import { productImageUpload } from "../../utils/upload-files";

export const productsRouter = Router();

productsRouter.get("/", asyncHandler(getProducts));
productsRouter.get("/admin", authMiddleware, requireRole("admin"), asyncHandler(getAdminProducts));
productsRouter.get("/meta", authMiddleware, requireRole("admin"), asyncHandler(getProductMeta));
productsRouter.post(
  "/",
  authMiddleware,
  requireRole("admin"),
  productImageUpload.array("images", 8),
  asyncHandler(postProduct)
);
productsRouter.put(
  "/:productId",
  authMiddleware,
  requireRole("admin"),
  validate(productIdSchema),
  productImageUpload.array("images", 8),
  asyncHandler(putProduct)
);
productsRouter.delete(
  "/:productId",
  authMiddleware,
  requireRole("admin"),
  validate(productIdSchema),
  asyncHandler(removeProduct)
);
