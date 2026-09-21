import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import type { MessageStore, UsageKind, UsageStore, VisitorMessage } from "./types";

/**
 * Conexión Postgres (Neon en Vercel o cualquier otro): una por proceso,
 * compartida por los stores. El esquema (schema.sql, idempotente) se
 * aplica la primera vez que se usa, así un deploy nuevo no necesita un
 * paso manual de migración.
 */
export class PostgresDb {
  readonly sql: ReturnType<typeof postgres>;
  private ready: Promise<void> | null = null;

  constructor(url: string) {
    this.sql = postgres(url, { max: 1, prepare: false });
  }

  ensureSchema(): Promise<void> {
    if (!this.ready) {
      this.ready = readFile(path.join(process.cwd(), "core/storage/schema.sql"), "utf8")
        .then((schema) => this.sql.unsafe(schema))
        .then(() => undefined)
        .catch((err) => {
          this.ready = null;
          throw err;
        });
    }
    return this.ready;
  }
}

/** Mensajes de visitantes sobre Postgres. */
export class PostgresMessageStore implements MessageStore {
  constructor(private readonly db: PostgresDb) {}
  private get sql() {
    return this.db.sql;
  }
  private ensureSchema() {
    return this.db.ensureSchema();
  }

  async save(m: Omit<VisitorMessage, "id" | "createdAt">): Promise<VisitorMessage> {
    await this.ensureSchema();
    const [row] = await this.sql<{ id: string; created_at: Date }[]>`
      INSERT INTO messages (tenant, session_id, name, email, body, ip_hash)
      VALUES (${m.tenant}, ${m.sessionId}, ${m.name}, ${m.email}, ${m.body}, ${m.ipHash})
      RETURNING id, created_at
    `;
    return { ...m, id: row.id, createdAt: row.created_at };
  }

  async countSince(ipHash: string, since: Date): Promise<number> {
    await this.ensureSchema();
    const [row] = await this.sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM messages WHERE ip_hash = ${ipHash} AND created_at >= ${since}
    `;
    return Number(row.n);
  }

  async hasDuplicate(sessionId: string, email: string, body: string, since: Date): Promise<boolean> {
    await this.ensureSchema();
    const rows = await this.sql`
      SELECT 1 FROM messages
      WHERE session_id = ${sessionId} AND email = ${email} AND body = ${body} AND created_at >= ${since}
      LIMIT 1
    `;
    return rows.length > 0;
  }
}

/** Contadores de uso sobre Postgres. */
export class PostgresUsageStore implements UsageStore {
  constructor(private readonly db: PostgresDb) {}

  async record(tenant: string, kind: UsageKind, ipHash: string): Promise<void> {
    await this.db.ensureSchema();
    await this.db.sql`INSERT INTO usage_events (tenant, kind, ip_hash) VALUES (${tenant}, ${kind}, ${ipHash})`;
  }

  async countByIp(ipHash: string, kind: UsageKind, since: Date): Promise<number> {
    await this.db.ensureSchema();
    const [row] = await this.db.sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM usage_events WHERE ip_hash = ${ipHash} AND kind = ${kind} AND created_at >= ${since}
    `;
    return Number(row.n);
  }

  async countByTenant(tenant: string, kind: UsageKind, since: Date): Promise<number> {
    await this.db.ensureSchema();
    const [row] = await this.db.sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM usage_events WHERE tenant = ${tenant} AND kind = ${kind} AND created_at >= ${since}
    `;
    return Number(row.n);
  }
}
