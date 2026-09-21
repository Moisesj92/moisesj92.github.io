/**
 * Cloudflare Turnstile: prueba de que quien pide un token de voz es un
 * navegador real, no un script. Invisible para el visitante salvo que
 * Cloudflare sospeche. Se exige solo si TURNSTILE_SECRET_KEY está
 * configurada; sin ella (desarrollo) se omite.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function turnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstile(token: string | undefined, ip: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };
  if (!token) return { ok: false, error: "Falta la verificación anti-bot" };
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    const body = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (body.success) return { ok: true };
    return { ok: false, error: `Verificación anti-bot rechazada (${(body["error-codes"] ?? []).join(", ") || "sin detalle"})` };
  } catch (err) {
    // Si Cloudflare no responde, no se bloquea al visitante: el rate limit y el presupuesto siguen ahí.
    console.warn("[turnstile] no se pudo verificar:", err instanceof Error ? err.message : err);
    return { ok: true };
  }
}
