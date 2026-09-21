import { MemoryMessageStore, MemorySettingsStore, MemoryTurnStore, MemoryUsageStore } from "./memory";
import { PostgresDb, PostgresMessageStore, PostgresSettingsStore, PostgresTurnStore, PostgresUsageStore } from "./postgres";
import type { MessageStore, SettingsStore, TurnStore, UsageStore } from "./types";

let db: PostgresDb | null | undefined;
let messages: MessageStore | null = null;
let usage: UsageStore | null = null;
let turns: TurnStore | null = null;
let settings: SettingsStore | null = null;

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

export function getTurnStore(): TurnStore {
  if (!turns) {
    const d = getDb();
    turns = d ? new PostgresTurnStore(d) : new MemoryTurnStore();
  }
  return turns;
}

export function getSettingsStore(): SettingsStore {
  if (!settings) {
    const d = getDb();
    settings = d ? new PostgresSettingsStore(d) : new MemorySettingsStore();
  }
  return settings;
}

/** ¿Hay base de datos real? Sin ella, el dashboard avisa que los datos son de memoria. */
export function hasDatabase(): boolean {
  return getDb() !== null;
}

export type { MessageStore, SettingsStore, StoredTurn, TurnRecord, TurnStats, TurnStore, UsageKind, UsageStore, VisitorMessage } from "./types";
