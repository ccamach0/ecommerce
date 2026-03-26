import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { billingRouter } from "./modules/billing/billing.routes";
import { ordersRouter } from "./modules/orders/orders.routes";
import { productsRouter } from "./modules/products/products.routes";
import { reportsRouter } from "./modules/reports/reports.routes";
import { reviewsRouter } from "./modules/reviews/reviews.routes";
import { storeRouter } from "./modules/store/store.routes";
import { usersRouter } from "./modules/users/users.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { uploadsRootDir } from "./utils/upload-files";

export const app = express();

app.use(
  cors({
    origin: env.APP_ORIGIN,
    credentials: true
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 200 }));
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(uploadsRootDir));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/billing", billingRouter);
app.use("/api/store", storeRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/users", usersRouter);
app.use(errorMiddleware);
