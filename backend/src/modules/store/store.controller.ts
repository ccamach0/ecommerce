import { Request, Response } from "express";
import { listOrders } from "../orders/orders.service";
import { listProducts } from "../products/products.service";
import { getDashboardStats } from "../reports/reports.service";
import { listReviews } from "../reviews/reviews.service";

export async function getStoreHome(_request: Request, response: Response) {
  const [products, orders, reviews, stats] = await Promise.all([
    listProducts(),
    listOrders(),
    listReviews(),
    getDashboardStats()
  ]);

  return response.status(200).json({
    hero: {
      title: "Moda premium para una compra mas simple y mas visual.",
      subtitle: "Catalogo moderno, detalles claros, checkout rapido y panel administrativo listo para crecer."
    },
    stats,
    products,
    orders,
    reviews
  });
}
