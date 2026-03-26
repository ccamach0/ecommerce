import { Response, Request } from "express";
import { getBillingSettings, upsertBillingSettings } from "./billing.service";

export async function getBilling(request: Request, response: Response) {
  const settings = await getBillingSettings();
  return response.status(200).json(settings);
}

export async function putBilling(request: Request, response: Response) {
  const settings = await upsertBillingSettings(request.body);
  return response.status(200).json(settings);
}
