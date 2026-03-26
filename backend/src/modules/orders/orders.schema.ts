import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().max(255).optional());

const itemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.preprocess((value) => Number(value), z.number().int().min(1))
});

export const posOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(2).max(180),
    customerEmail: z.string().email().optional(),
    customerPhone: optionalText,
    documentType: z.enum(["none", "boleta", "factura"]).default("none"),
    customerDocumentType: z.enum(["DNI", "RUC", "CE", "PASSPORT", "OTHER"]).optional(),
    customerDocumentNumber: z.preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length === 0 ? undefined : trimmedValue;
    }, z.string().max(20).optional()),
    customerLegalName: optionalText,
    customerAddress: optionalText,
    paymentMethod: z.enum(["cash", "card", "transfer"]),
    amountReceived: z.preprocess((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }

      return Number(value);
    }, z.number().finite().positive().optional()),
    notes: optionalText,
    items: z.array(itemSchema).min(1)
  }).superRefine((data, context) => {
    if (data.documentType === "factura") {
      if (data.customerDocumentType !== "RUC") {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerDocumentType"],
          message: "La factura requiere RUC como tipo de documento."
        });
      }

      if (!/^\d{11}$/.test(data.customerDocumentNumber ?? "")) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerDocumentNumber"],
          message: "La factura requiere un RUC valido de 11 digitos."
        });
      }

      if (!data.customerLegalName) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerLegalName"],
          message: "La factura requiere razon social o nombre fiscal."
        });
      }
    }
  }),
  params: z.object({}),
  query: z.object({})
});
