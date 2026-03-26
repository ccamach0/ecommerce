import { Request, Response } from "express";
import { getCurrentSession, loginUser } from "./auth.service";
import { HttpError } from "../../utils/http-error";

export async function login(request: Request, response: Response) {
  const { email, password } = request.body;
  const result = await loginUser(email, password);

  return response.status(200).json(result);
}

export async function me(request: Request, response: Response) {
  if (!request.auth?.sub) {
    throw new HttpError(401, "Sesion no valida");
  }

  const user = await getCurrentSession(request.auth.sub);

  return response.status(200).json({ user });
}
