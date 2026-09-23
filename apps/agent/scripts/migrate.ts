import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

/** Aplica core/storage/schema.sql. Idempotente. Uso: DATABASE_URL=... pnpm db:migrate */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });
const schema = readFileSync(path.join(process.cwd(), "core/storage/schema.sql"), "utf8");
await sql.unsafe(schema);
await sql.end();
console.log("Esquema aplicado");
