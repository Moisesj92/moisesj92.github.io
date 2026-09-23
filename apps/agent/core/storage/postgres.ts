import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { computeStats } from "./stats";
import type {
  MessageStore,
  SettingsStore,
  StoredTurn,
  TurnRecord,
  TurnStats,
  TurnStore,
  UsageKind,
  UsageStore,
  VisitorMessage,
} from "./types";

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

  async listRecent(tenant: string, limit: number): Promise<VisitorMessage[]> {
    await this.ensureSchema();
    const rows = await this.sql<
      { id: string; tenant: string; session_id: string; name: string; email: string; body: string; ip_hash: string; created_at: Date }[]
    >`SELECT * FROM messages WHERE tenant = ${tenant} ORDER BY created_at DESC LIMIT ${limit}`;
    return rows.map((r) => ({
      id: r.id,
      tenant: r.tenant,
      sessionId: r.session_id,
      name: r.name,
      email: r.email,
      body: r.body,
      ipHash: r.ip_hash,
      createdAt: r.created_at,
    }));
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

/** Turnos sobre Postgres. */
export class PostgresTurnStore implements TurnStore {
  constructor(private readonly db: PostgresDb) {}

  async save(t: TurnRecord): Promise<void> {
    await this.db.ensureSchema();
    await this.db.sql`
      INSERT INTO turns (tenant, session_id, channel, user_text, agent_text, tools, sources, model, ms, ttfa_ms, refused)
      VALUES (${t.tenant}, ${t.sessionId}, ${t.channel}, ${t.userText}, ${t.agentText}, ${this.db.sql.json(t.tools)},
              ${t.sources}, ${t.model ?? null}, ${t.ms ?? null}, ${t.ttfaMs ?? null}, ${t.refused})
    `;
  }

  private async rows(tenant: string, since: Date | null, limit: number | null): Promise<StoredTurn[]> {
    await this.db.ensureSchema();
    const rows = await this.db.sql<
      {
        id: number;
        tenant: string;
        session_id: string;
        channel: "text" | "voice";
        user_text: string;
        agent_text: string;
        tools: TurnRecord["tools"] | string;
        sources: string[];
        model: string | null;
        ms: number | null;
        ttfa_ms: number | null;
        refused: boolean;
        created_at: Date;
      }[]
    >`
      SELECT * FROM turns
      WHERE tenant = ${tenant} ${since ? this.db.sql`AND created_at >= ${since}` : this.db.sql``}
      ORDER BY created_at DESC
      ${limit ? this.db.sql`LIMIT ${limit}` : this.db.sql``}
    `;
    return rows.map((r) => ({
      id: Number(r.id),
      tenant: r.tenant,
      sessionId: r.session_id,
      channel: r.channel,
      userText: r.user_text,
      agentText: r.agent_text,
      // Filas antiguas quedaron con el JSON doblemente codificado (string dentro de jsonb).
      tools: typeof r.tools === "string" ? (JSON.parse(r.tools) as TurnRecord["tools"]) : (r.tools ?? []),
      sources: r.sources ?? [],
      model: r.model ?? undefined,
      ms: r.ms ?? undefined,
      ttfaMs: r.ttfa_ms ?? undefined,
      refused: r.refused,
      createdAt: r.created_at,
    }));
  }

  listRecent(tenant: string, limit: number): Promise<StoredTurn[]> {
    return this.rows(tenant, null, limit);
  }

  async stats(tenant: string, since: Date): Promise<TurnStats> {
    return computeStats(await this.rows(tenant, since, null));
  }

  async purge(before: Date): Promise<number> {
    await this.db.ensureSchema();
    const r = await this.db.sql`DELETE FROM turns WHERE created_at < ${before}`;
    return r.count;
  }
}

/** Ajustes sobre Postgres. */
export class PostgresSettingsStore implements SettingsStore {
  constructor(private readonly db: PostgresDb) {}

  async get(key: string): Promise<string | null> {
    await this.db.ensureSchema();
    const [row] = await this.db.sql<{ value: string }[]>`SELECT value FROM settings WHERE key = ${key}`;
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.db.ensureSchema();
    await this.db.sql`
      INSERT INTO settings (key, value) VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  }
}
