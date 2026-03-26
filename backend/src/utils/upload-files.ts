import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Request } from "express";
import multer from "multer";
import { HttpError } from "./http-error";

export const uploadsRootDir = path.resolve(process.cwd(), "uploads");
const productsUploadsDir = path.join(uploadsRootDir, "products");

fs.mkdirSync(productsUploadsDir, { recursive: true });

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, productsUploadsDir);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  }
});

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new HttpError(400, "Solo se permiten imagenes JPG, PNG o WEBP."));
      return;
    }

    callback(null, true);
  }
});

export function buildProductImageUrl(request: Request, filename: string) {
  const host = request.get("host") ?? `localhost:${process.env.PORT ?? 4000}`;
  return `${request.protocol}://${host}/uploads/products/${filename}`;
}

export function deleteLocalFileByUrl(fileUrl?: string | null) {
  if (!fileUrl) {
    return;
  }

  try {
    const parsedUrl = new URL(fileUrl);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    if (!pathname.startsWith("/uploads/")) {
      return;
    }

    const relativePath = pathname.replace(/^\/uploads\//, "");
    const resolvedPath = path.resolve(uploadsRootDir, relativePath);

    if (!resolvedPath.startsWith(uploadsRootDir)) {
      return;
    }

    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch {
    return;
  }
}
