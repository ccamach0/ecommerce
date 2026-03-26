import { Request, Response } from "express";
import { HttpError } from "../../utils/http-error";
import { createUser, deactivateUser, listUsers, updateUser } from "./users.service";

function getUserIdParam(request: Request) {
  const { userId } = request.params;

  if (!userId) {
    throw new HttpError(400, "Usuario no identificado.");
  }

  return Array.isArray(userId) ? userId[0] : userId;
}

export async function getUsers(_request: Request, response: Response) {
  const users = await listUsers();
  return response.status(200).json(users);
}

export async function postUser(request: Request, response: Response) {
  const user = await createUser(request.body);
  return response.status(201).json(user);
}

export async function putUser(request: Request, response: Response) {
  if (!request.auth?.sub) {
    throw new HttpError(401, "No autorizado");
  }

  const user = await updateUser(getUserIdParam(request), request.body, request.auth.sub);
  return response.status(200).json(user);
}

export async function removeUser(request: Request, response: Response) {
  if (!request.auth?.sub) {
    throw new HttpError(401, "No autorizado");
  }

  const user = await deactivateUser(getUserIdParam(request), request.auth.sub);
  return response.status(200).json(user);
}
