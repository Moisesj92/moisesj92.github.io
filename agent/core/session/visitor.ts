import { createHash } from "node:crypto";

/**
 * Identidad mínima del visitante para rate limit: hash del IP con sal.
 * Nunca se guarda el IP en claro (privacidad, Fase 3).
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? "dev-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export function requestIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "0.0.0.0";
}
