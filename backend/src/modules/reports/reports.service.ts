import { pool } from "../../config/db";
import { mockDashboard } from "../../data/mock-store";

type DashboardRow = {
  revenue_month: string | number;
  active_orders: string | number;
  low_stock_products: string | number;
  conversion_rate: string | number;
};

type TopProductRow = {
  name: string;
  sold: string | number;
};

export async function getDashboardStats() {
  try {
    const [metricsResult, topProductsResult] = await Promise.all([
      pool.query<DashboardRow>("SELECT * FROM app_get_dashboard_metrics()"),
      pool.query<TopProductRow>("SELECT * FROM app_get_dashboard_top_products($1)", [5])
    ]);

    const metrics = metricsResult.rows[0];

    if (!metrics) {
      return mockDashboard;
    }

    return {
      revenueMonth: Number(metrics.revenue_month ?? 0),
      activeOrders: Number(metrics.active_orders ?? 0),
      lowStockProducts: Number(metrics.low_stock_products ?? 0),
      conversionRate: Number(metrics.conversion_rate ?? 0),
      topProducts: topProductsResult.rows.map((row) => ({
        name: row.name,
        sold: Number(row.sold)
      }))
    };
  } catch {
    return mockDashboard;
  }
}
