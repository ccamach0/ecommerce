import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}, z.string().max(255).optional());

const optionalSeries = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toUpperCase();
  return normalized.length === 0 ? undefined : normalized;
}, z.string().min(3).max(4).optional());

const booleanValue = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "on" || value === "1";
  }

  return false;
}, z.boolean());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
}, z.number().finite().nonnegative().optional());

export const billingSettingsSchema = z.object({
  body: z.object({
    countryCode: z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.string().length(2).default("PE")),
    legalName: optionalText,
    tradeName: optionalText,
    taxId: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().max(20).optional()),
    taxIdType: z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.string().max(20).default("RUC")),
    fiscalAddress: optionalText,
    department: optionalText,
    province: optionalText,
    district: optionalText,
    ubigeo: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().length(6).optional()),
    establishmentCode: z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.string().min(1).max(4).default("0000")),
    currencyCode: z.preprocess((value) => (typeof value === "string" ? value.trim().toUpperCase() : value), z.string().length(3).default("PEN")),
    igvRate: optionalNumber,
    pricesIncludeTax: booleanValue.default(true),
    invoiceSeries: optionalSeries,
    receiptSeries: optionalSeries,
    creditNoteSeries: optionalSeries,
    debitNoteSeries: optionalSeries,
    sunatEnvironment: z.enum(["beta", "production"]).default("beta"),
    emissionSystem: z.enum(["own_software", "sunat", "pse"]).default("own_software"),
    solUser: optionalText,
    certificateAlias: optionalText,
    supportEmail: z.preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length === 0 ? undefined : trimmedValue;
    }, z.string().email().optional()),
    supportPhone: optionalText,
    sendAutomatically: booleanValue.default(false),
    isActive: booleanValue.default(true)
  }),
  params: z.object({}),
  query: z.object({})
});
