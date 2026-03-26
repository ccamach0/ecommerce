import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createProduct,
  deleteProduct,
  listProductCategories,
  listProducts,
  updateProduct
} from "./products.service";
import { buildProductImageUrl, deleteLocalFileByUrl } from "../../utils/upload-files";
import { parseProductPayload } from "./products.schema";
import { HttpError } from "../../utils/http-error";

function resolveUploadedImageUrls(request: Request) {
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  return files.map((file) => buildProductImageUrl(request, file.filename));
}

function cleanupUploadedFiles(request: Request) {
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];

  for (const file of files) {
    deleteLocalFileByUrl(buildProductImageUrl(request, file.filename));
  }
}

function getProductIdParam(request: Request) {
  const { productId } = request.params;

  if (!productId) {
    throw new HttpError(400, "Producto no identificado.");
  }

  return Array.isArray(productId) ? productId[0] : productId;
}

export async function getProducts(_request: Request, response: Response) {
  const products = await listProducts();
  return response.status(200).json(products);
}

export async function getAdminProducts(_request: Request, response: Response) {
  const products = await listProducts({ includeInactive: true });
  return response.status(200).json(products);
}

export async function getProductMeta(_request: Request, response: Response) {
  const categories = await listProductCategories();
  return response.status(200).json({ categories });
}

export async function postProduct(request: Request, response: Response) {
  try {
    const payload = parseProductPayload(request.body);
    const imageUrls = resolveUploadedImageUrls(request);
    const product = await createProduct(payload, imageUrls);

    return response.status(201).json(product);
  } catch (error) {
    cleanupUploadedFiles(request);
    throw error;
  }
}

export async function putProduct(request: Request, response: Response) {
  try {
    const payload = parseProductPayload(request.body);
    const imageUrls = resolveUploadedImageUrls(request);
    const result = await updateProduct(getProductIdParam(request), payload, imageUrls);

    for (const removedImageUrl of result.removedImageUrls) {
      deleteLocalFileByUrl(removedImageUrl);
    }

    return response.status(200).json(result.product);
  } catch (error) {
    cleanupUploadedFiles(request);

    if (error instanceof ZodError) {
      throw error;
    }

    throw error;
  }
}

export async function removeProduct(request: Request, response: Response) {
  const result = await deleteProduct(getProductIdParam(request));

  if (result.mode === "deleted") {
    for (const imageUrl of result.imageUrls) {
      deleteLocalFileByUrl(imageUrl);
    }
  }

  return response.status(200).json({
    message: result.mode === "deleted" ? "Producto eliminado." : "Producto archivado por historial relacionado."
  });
}
