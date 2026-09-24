import { getTurnStore } from "../storage";

/**
 * Registro estructurado por turno: a stdout (Vercel Logs) y a la base
 * (dashboard /admin). Nunca contiene audio ni datos de contacto del
 * visitante: correos y teléfonos se redactan antes de escribir. Retención
 * de 30 días: la purga corre de vez en cuando al escribir.
 */
export const RETENTION_DAYS = 30;
/** Probabilidad de purgar al escribir un turno: barato, sin cron. */
const PURGE_CHANCE = 0.02;
export interface TurnLog {
  channel: "text" | "voice";
  tenant: string;
  sessionId: string;
  user: string;
  agent: string;
  tools: { name: string; ok: boolean; ms?: number }[];
  sources: string[];
  model?: string;
  ms?: number;
  /** tiempo al primer audio de la sesión, solo en el primer turno de voz */
  ttfaMs?: number;
  refused: boolean;
  /** utm_source con el que llegó la visita, ya validado */
  origin?: string;
}

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const PHONE = /(\+?\d[\d\s().-]{7,}\d)/g;

export function redact(text: string): string {
  return text.replace(EMAIL, "[email]").replace(PHONE, "[tel]");
}

export function logTurn(entry: TurnLog): void {
  const record = {
    ts: new Date().toISOString(),
    ...entry,
    user: redact(entry.user).slice(0, 500),
    agent: redact(entry.agent).slice(0, 1000),
  };
  console.log(`[turn] ${JSON.stringify(record)}`);
  // Persistir sin bloquear la respuesta ni tumbarla si la base falla.
  void persist(record).catch((err) => console.warn("[turn] no se pudo guardar:", err instanceof Error ? err.message : err));
}

async function persist(r: TurnLog & { user: string; agent: string }): Promise<void> {
  const store = getTurnStore();
  await store.save({
    tenant: r.tenant,
    sessionId: r.sessionId,
    channel: r.channel,
    userText: r.user,
    agentText: r.agent,
    tools: r.tools,
    sources: r.sources,
    model: r.model,
    ms: r.ms,
    ttfaMs: r.ttfaMs,
    refused: r.refused,
    origin: r.origin,
  });
  if (Math.random() < PURGE_CHANCE) {
    const n = await store.purge(new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000));
    if (n > 0) console.info(`[turn] retención: ${n} turnos borrados (> ${RETENTION_DAYS} días)`);
  }
}
