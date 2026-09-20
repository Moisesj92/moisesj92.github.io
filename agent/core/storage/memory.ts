import type { MessageStore, VisitorMessage } from "./types";

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
}
