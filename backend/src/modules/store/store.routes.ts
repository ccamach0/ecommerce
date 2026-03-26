import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { getStoreHome } from "./store.controller";

export const storeRouter = Router();

storeRouter.get("/home", asyncHandler(getStoreHome));
