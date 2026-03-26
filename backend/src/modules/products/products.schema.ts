import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().max(255).optional());

const optionalLongText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().optional());

const requiredNumber = z.preprocess((value) => Number(value), z.number().finite().positive());
const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().finite().nonnegative().optional());

const requiredInteger = z.preprocess((value) => Number(value), z.number().int().min(0));

const booleanValue = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return false;
}, z.boolean());

const variantSchema = z.object({
  id: z.string().uuid().optional(),
  size: z.string().min(1).max(40),
  stock: requiredInteger,
  sku: optionalText,
  barcode: optionalText,
  weightGrams: optionalNumber
});

const imageMetaSchema = z.object({
  id: z.string().uuid().optional(),
  altText: optionalText,
  isPrimary: booleanValue.default(false),
  sortOrder: requiredInteger,
  uploadIndex: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return Number(value);
  }, z.number().int().min(0).optional())
});

const variantsField = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as unknown;
  }

  return value;
}, z.array(variantSchema).min(1));

const imagesMetaField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return JSON.parse(value) as unknown;
  }

  return value;
}, z.array(imageMetaSchema).default([]));

export const productPayloadSchema = z.object({
  name: z.string().min(3).max(180),
  slug: z.string().min(3).max(200),
  description: z.string().min(10),
  categoryId: z.string().uuid(),
  basePrice: requiredNumber,
  salePrice: optionalNumber,
  color: z.string().min(2).max(80),
  status: z.enum(["draft", "active", "archived"]).default("draft"),
  featured: booleanValue.default(false),
  brand: optionalText,
  material: optionalText,
  gender: optionalText,
  seoTitle: optionalText,
  seoDescription: optionalLongText,
  imageAltText: optionalText,
  variants: variantsField,
  imagesMeta: imagesMetaField
});

export const productIdSchema = z.object({
  params: z.object({
    productId: z.string().uuid()
  }),
  body: z.object({}).passthrough(),
  query: z.object({})
});

export function parseProductPayload(input: unknown) {
  return productPayloadSchema.parse(input);
}
