import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.DATABASE_URL || "file:sqlite.db",
});

async function migrate() {
  console.log("Creating coupons table...");
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        value REAL NOT NULL,
        min_order_value REAL DEFAULT 0,
        max_discount REAL,
        is_first_order_only INTEGER DEFAULT 0,
        applicable_categories TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Adding discount columns to orders table...");
    try {
      await client.execute(`ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;`);
      console.log("Added discount_amount to orders");
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        console.log("discount_amount column already exists in orders");
      } else {
        throw e;
      }
    }

    try {
      await client.execute(`ALTER TABLE orders ADD COLUMN coupon_code TEXT;`);
      console.log("Added coupon_code to orders");
    } catch (e: any) {
      if (e.message.includes("duplicate column name")) {
        console.log("coupon_code column already exists in orders");
      } else {
        throw e;
      }
    }

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

migrate();
