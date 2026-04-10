import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,                  // keep pool small — Neon free tier has connection limits
  idleTimeoutMillis: 10_000,   // release idle connections after 10s (before Neon drops them)
  connectionTimeoutMillis: 10_000, // fail fast if can't connect in 10s
  keepAlive: true,         // TCP keepalive to detect dropped connections early
});
export const db = drizzle(pool, { schema });

export * from "./schema";
