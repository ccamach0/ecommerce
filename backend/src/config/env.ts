import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ORIGIN: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("8h")
});

export const env = envSchema.parse(process.env);
