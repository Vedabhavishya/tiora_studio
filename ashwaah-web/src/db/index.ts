import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
const authToken = process.env.DATABASE_AUTH_TOKEN;

// Initialize the client based on the environment
const client = (url && url !== "file:sqlite.db") 
  ? createClient({ url, authToken })
  : createClient({ url: "file:sqlite.db" }); // Local fallback

export const db = drizzle(client, { schema });
