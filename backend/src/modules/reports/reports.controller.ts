import { Request, Response } from "express";
import { getDashboardStats } from "./reports.service";

export async function getDashboard(_request: Request, response: Response) {
  const dashboard = await getDashboardStats();
  return response.status(200).json(dashboard);
}
