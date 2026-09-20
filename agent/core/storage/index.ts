import { MemoryMessageStore } from "./memory";
import { PostgresMessageStore } from "./postgres";
import type { MessageStore } from "./types";

let store: MessageStore | null = null;

/** Postgres si hay DATABASE_URL; memoria en desarrollo. Uno por proceso. */
export function getMessageStore(): MessageStore {
  if (!store) {
    // Neon vía Vercel define DATABASE_URL y POSTGRES_URL; cualquiera sirve.
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    store = url ? new PostgresMessageStore(url) : new MemoryMessageStore();
  }
  return store;
}

export type { MessageStore, VisitorMessage } from "./types";
