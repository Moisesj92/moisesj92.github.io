import { DIRECT_ORIGIN } from "../observability/origin";
import { normalize } from "../retrieval/tokenize";
import type { StoredTurn, TurnStats } from "./types";

function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

/**
 * Agregados del dashboard a partir de turnos en memoria. Postgres podría
 * hacerlo en SQL, pero con retención de 30 días y un tenant, traer los
 * turnos y agregar aquí es más simple y sirve para los dos stores.
 */
export function computeStats(turns: StoredTurn[]): TurnStats {
  const sessions = new Map<string, { first: number; last: number }>();
  const byChannel = new Map<string, number>();
  const byModel = new Map<string, number>();
  const questions = new Map<string, { question: string; count: number }>();
  const ttfa: number[] = [];
  const originBySession = new Map<string, string>();
  let refused = 0;

  for (const t of turns) {
    const at = t.createdAt.getTime();
    const s = sessions.get(t.sessionId);
    if (s) {
      s.first = Math.min(s.first, at);
      s.last = Math.max(s.last, at);
    } else sessions.set(t.sessionId, { first: at, last: at });
    byChannel.set(t.channel, (byChannel.get(t.channel) ?? 0) + 1);
    if (t.model) byModel.set(t.model, (byModel.get(t.model) ?? 0) + 1);
    if (t.refused) refused++;
    // El origen es de la sesión, no del turno: se queda el primero que aparezca.
    if (t.origin && !originBySession.has(t.sessionId)) originBySession.set(t.sessionId, t.origin);
    if (t.ttfaMs != null) ttfa.push(t.ttfaMs);
    const key = normalize(t.userText).replace(/[^a-z0-9 ]/g, "").trim().slice(0, 80);
    if (key.length >= 4) {
      const q = questions.get(key);
      if (q) q.count++;
      else questions.set(key, { question: t.userText.slice(0, 100), count: 1 });
    }
  }

  const durations = [...sessions.values()].map((s) => (s.last - s.first) / 1000);
  const byOrigin = new Map<string, number>();
  for (const id of sessions.keys()) {
    const origin = originBySession.get(id) ?? DIRECT_ORIGIN;
    byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + 1);
  }
  return {
    sessions: sessions.size,
    turns: turns.length,
    refusalRate: turns.length ? refused / turns.length : 0,
    medianSessionSeconds: percentile(durations, 50) ?? 0,
    ttfaP50Ms: percentile(ttfa, 50),
    ttfaP95Ms: percentile(ttfa, 95),
    byChannel: [...byChannel].map(([channel, turns]) => ({ channel, turns })),
    byModel: [...byModel].map(([model, turns]) => ({ model, turns })).sort((a, b) => b.turns - a.turns),
    topQuestions: [...questions.values()].sort((a, b) => b.count - a.count).slice(0, 15),
    byOrigin: [...byOrigin].map(([origin, sessions]) => ({ origin, sessions })).sort((a, b) => b.sessions - a.sessions),
  };
}
