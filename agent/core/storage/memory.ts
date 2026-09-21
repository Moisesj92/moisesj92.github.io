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
import { computeStats } from "./stats";

/**
 * Almacén en memoria para desarrollo sin base de datos. En serverless no
 * sirve (cada invocación es un proceso nuevo); por eso avisa al crearse.
 */
export class MemoryMessageStore implements MessageStore {
  private readonly messages: VisitorMessage[] = [];

  constructor() {
    console.warn("[storage] sin DATABASE_URL: los mensajes se guardan en memoria y se pierden al reiniciar");
  }

  async save(message: Omit<VisitorMessage, "id" | "createdAt">): Promise<VisitorMessage> {
    const saved = { ...message, id: crypto.randomUUID(), createdAt: new Date() };
    this.messages.push(saved);
    console.info("[storage] mensaje guardado en memoria:", { name: saved.name, email: saved.email });
    return saved;
  }

  async countSince(ipHash: string, since: Date): Promise<number> {
    return this.messages.filter((m) => m.ipHash === ipHash && m.createdAt >= since).length;
  }

  async hasDuplicate(sessionId: string, email: string, body: string, since: Date): Promise<boolean> {
    return this.messages.some(
      (m) => m.sessionId === sessionId && m.email === email && m.body === body && m.createdAt >= since,
    );
  }

  async listRecent(tenant: string, limit: number): Promise<VisitorMessage[]> {
    return this.messages.filter((m) => m.tenant === tenant).slice(-limit).reverse();
  }
}

/** Contadores en memoria para desarrollo. */
export class MemoryUsageStore implements UsageStore {
  private readonly events: { tenant: string; kind: UsageKind; ipHash: string; at: Date }[] = [];

  async record(tenant: string, kind: UsageKind, ipHash: string): Promise<void> {
    this.events.push({ tenant, kind, ipHash, at: new Date() });
  }
  async countByIp(ipHash: string, kind: UsageKind, since: Date): Promise<number> {
    return this.events.filter((e) => e.ipHash === ipHash && e.kind === kind && e.at >= since).length;
  }
  async countByTenant(tenant: string, kind: UsageKind, since: Date): Promise<number> {
    return this.events.filter((e) => e.tenant === tenant && e.kind === kind && e.at >= since).length;
  }
}

/** Turnos en memoria para desarrollo. */
export class MemoryTurnStore implements TurnStore {
  private readonly turns: StoredTurn[] = [];

  async save(turn: TurnRecord): Promise<void> {
    this.turns.push({ ...turn, id: this.turns.length + 1, createdAt: new Date() });
  }
  async listRecent(tenant: string, limit: number): Promise<StoredTurn[]> {
    return this.turns.filter((t) => t.tenant === tenant).slice(-limit).reverse();
  }
  async stats(tenant: string, since: Date): Promise<TurnStats> {
    return computeStats(this.turns.filter((t) => t.tenant === tenant && t.createdAt >= since));
  }
  async purge(before: Date): Promise<number> {
    const n = this.turns.length;
    const keep = this.turns.filter((t) => t.createdAt >= before);
    this.turns.length = 0;
    this.turns.push(...keep);
    return n - keep.length;
  }
}

export class MemorySettingsStore implements SettingsStore {
  private readonly map = new Map<string, string>();
  async get(key: string) {
    return this.map.get(key) ?? null;
  }
  async set(key: string, value: string) {
    this.map.set(key, value);
  }
}
