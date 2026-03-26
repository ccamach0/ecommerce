import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/http-error";

type AuthPayload = {
  sub: string;
  role: "admin" | "customer" | "cashier";
  email?: string;
  name?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authMiddleware(request: Request, response: Response, next: NextFunction) {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return response.status(401).json({ message: "No autorizado" });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "admin" && payload.role !== "customer" && payload.role !== "cashier")
    ) {
      throw new HttpError(401, "Token invalido");
    }

    request.auth = {
      sub: payload.sub,
      role: payload.role,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined
    };
    return next();
  } catch {
    return response.status(401).json({ message: "Token invalido" });
  }
}

export function requireRole(...roles: Array<AuthPayload["role"]>) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      return response.status(403).json({ message: "Permisos insuficientes" });
    }

    return next();
  };
}
