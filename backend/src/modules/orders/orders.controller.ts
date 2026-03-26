import { Request, Response } from "express";
import { createPosOrder, listOrders } from "./orders.service";
import { HttpError } from "../../utils/http-error";

export async function getOrders(request: Request, response: Response) {
  if (!request.auth?.sub) {
    throw new HttpError(401, "No autorizado");
  }

  const orders = await listOrders({
    userId: request.auth.sub,
    role: request.auth.role
  });

  return response.status(200).json(orders);
}

export async function postPosOrder(request: Request, response: Response) {
  if (!request.auth?.sub) {
    throw new HttpError(401, "No autorizado");
  }

  const order = await createPosOrder(request.body, request.auth.sub);

  return response.status(201).json({
    message: "Venta presencial registrada correctamente.",
    order
  });
}
