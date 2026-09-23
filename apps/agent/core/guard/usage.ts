import type { AgentConfig } from "../config/schema";
import { getSettingsStore, getUsageStore } from "../storage";
import type { UsageKind } from "../storage/types";
import { sendAlert } from "./alert";

const DAY_MS = 24 * 60 * 60 * 1000;

export const KILL_SWITCH_KEY = "kill_switch";
export type KillSwitch = "" | "voice" | "text" | "all";
const KILL_CACHE_MS = 15_000;
let killCache: { value: KillSwitch; at: number } | null = null;

/**
 * Kill-switch efectivo: el de la base (/admin, aplica al instante) o el de
 * entorno (AGENT_KILL_SWITCH, requiere redeploy). Cache corta por proceso.
 */
export async function getKillSwitch(): Promise<KillSwitch> {
  const env = process.env.AGENT_KILL_SWITCH as KillSwitch | undefined;
  if (env === "all") return "all";
  if (!killCache || Date.now() - killCache.at > KILL_CACHE_MS) {
    let value: KillSwitch = "";
    try {
      value = ((await getSettingsStore().get(KILL_SWITCH_KEY)) ?? "") as KillSwitch;
    } catch (err) {
      console.warn("[guard] no se pudo leer el kill-switch:", err instanceof Error ? err.message : err);
    }
    killCache = { value, at: Date.now() };
  }
  const db = killCache.value;
  if (db === "all" || env === db) return db || env || "";
  if (env && db) return "all";
  return db || env || "";
}

export async function setKillSwitch(value: KillSwitch): Promise<void> {
  await getSettingsStore().set(KILL_SWITCH_KEY, value);
  killCache = { value, at: Date.now() };
}

export type UsageDenial =
  | { ok: false; reason: "kill_switch" | "budget" | "rate_limit"; message: string; retryAfterSeconds: number }
  | { ok: true; tenantCount: number; tenantLimit: number };

/**
 * Contención de abuso y costo, en este orden: kill-switch manual (env),
 * presupuesto diario del tenant (kill-switch automático) y rate limit por
 * IP. Ventana móvil de 24 h. Si pasa, registra el evento y avisa al
 * cruzar el 50 % y el 100 % del presupuesto.
 *
 * La voz se cuenta al emitir el token (es el único punto del servidor;
 * la sesión se abre navegador → Gemini), así que un token precalentado
 * que no se usa también cuenta. Los límites están dimensionados para eso.
 */
export async function checkAndRecordUsage(
  config: AgentConfig,
  kind: UsageKind,
  ipHash: string,
): Promise<UsageDenial> {
  const channel = kind === "voice_session" ? "voz" : "texto";
  const kill = await getKillSwitch();
  if (kill === "all" || (kill === "voice" && kind === "voice_session") || (kill === "text" && kind === "text_turn")) {
    return {
      ok: false,
      reason: "kill_switch",
      message: `El canal de ${channel} está desactivado temporalmente.`,
      retryAfterSeconds: 3600,
    };
  }

  const store = getUsageStore();
  const since = new Date(Date.now() - DAY_MS);
  const { limits } = config;
  const tenantLimit = kind === "voice_session" ? limits.voiceSessionsPerDay : limits.textTurnsPerDay;
  const ipLimit = kind === "voice_session" ? limits.voiceSessionsPerIpPerDay : limits.textTurnsPerIpPerDay;

  const [tenantCount, ipCount] = await Promise.all([
    store.countByTenant(config.id, kind, since),
    store.countByIp(ipHash, kind, since),
  ]);

  if (tenantCount >= tenantLimit) {
    return {
      ok: false,
      reason: "budget",
      message: `La ${channel} alcanzó su presupuesto de hoy.`,
      retryAfterSeconds: 3600,
    };
  }
  if (ipCount >= ipLimit) {
    return {
      ok: false,
      reason: "rate_limit",
      message: `Has usado el máximo de ${channel} por hoy desde esta conexión.`,
      retryAfterSeconds: 3600,
    };
  }

  await store.record(config.id, kind, ipHash);
  const count = tenantCount + 1;
  for (const pct of [50, 100]) {
    if (count === Math.ceil((tenantLimit * pct) / 100)) {
      void sendAlert(
        `${config.displayName}: ${channel} al ${pct} % del presupuesto diario`,
        `${count}/${tenantLimit} ${kind === "voice_session" ? "sesiones de voz" : "turnos de texto"} en las últimas 24 h.${pct === 100 ? " El canal queda cerrado hasta que baje el contador." : ""}`,
      );
    }
  }
  return { ok: true, tenantCount: count, tenantLimit };
}
