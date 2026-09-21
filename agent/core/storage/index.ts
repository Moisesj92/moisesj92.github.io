import { MemoryMessageStore, MemoryUsageStore } from "./memory";
import { PostgresDb, PostgresMessageStore, PostgresUsageStore } from "./postgres";
import type { MessageStore, UsageStore } from "./types";

let db: PostgresDb | null | undefined;
let messages: MessageStore | null = null;
let usage: UsageStore | null = null;

/** Neon vía Vercel define DATABASE_URL y POSTGRES_URL; cualquiera sirve. Sin ninguna, memoria (desarrollo). */
function getDb(): PostgresDb | null {
  if (db === undefined) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    db = url ? new PostgresDb(url) : null;
  }
  return db;
}

export function getMessageStore(): MessageStore {
  if (!messages) {
    const d = getDb();
    messages = d ? new PostgresMessageStore(d) : new MemoryMessageStore();
  }
  return messages;
}

export function getUsageStore(): UsageStore {
  if (!usage) {
    const d = getDb();
    usage = d ? new PostgresUsageStore(d) : new MemoryUsageStore();
  }
  return usage;
}

export type { MessageStore, UsageKind, UsageStore, VisitorMessage } from "./types";
