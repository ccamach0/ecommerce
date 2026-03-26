import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error";

export function errorMiddleware(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      message: "Datos invalidos",
      issues: error.flatten()
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  if (error instanceof Error) {
    return response.status(500).json({
      message: error.message
    });
  }

  return response.status(500).json({
    message: "Error interno del servidor"
  });
}
