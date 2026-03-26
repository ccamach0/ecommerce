import { Request, Response } from "express";
import { listReviews } from "./reviews.service";

export async function getReviews(_request: Request, response: Response) {
  const reviews = await listReviews();
  return response.status(200).json(reviews);
}
