/**
 * Registro estructurado por turno. Hoy va a stdout (Vercel Logs); en Fase 3
 * se persiste y alimenta el dashboard. Nunca contiene audio ni datos de
 * contacto del visitante: correos y teléfonos se redactan antes de escribir.
 */
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
}
