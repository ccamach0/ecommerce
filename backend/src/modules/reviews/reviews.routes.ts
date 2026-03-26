import { Router } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { getReviews } from "./reviews.controller";

export const reviewsRouter = Router();

reviewsRouter.get("/", asyncHandler(getReviews));
