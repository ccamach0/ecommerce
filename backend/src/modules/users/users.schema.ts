import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().max(180).optional());

const booleanValue = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return false;
}, z.boolean());

const baseUserPayloadSchema = z.object({
  role: z.enum(["admin", "customer", "cashier"]),
  firstName: z.string().min(2).max(100),
  lastName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: optionalText,
  isActive: booleanValue.default(true)
});

export const createUserSchema = z.object({
  body: baseUserPayloadSchema.extend({
    password: z.string().min(8)
  }),
  params: z.object({}),
  query: z.object({})
});

export const updateUserSchema = z.object({
  body: baseUserPayloadSchema.extend({
    password: z.string().min(8).optional()
  }),
  params: z.object({
    userId: z.string().uuid()
  }),
  query: z.object({})
});

export const userIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    userId: z.string().uuid()
  }),
  query: z.object({})
});
