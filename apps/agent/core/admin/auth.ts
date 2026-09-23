import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "agent_admin";
const COOKIE_MAX_AGE_S = 7 * 24 * 60 * 60;

export function adminConfigured(): boolean {
  return !!process.env.ADMIN_PASSWORD;
}

/**
 * Token de sesión de administración: HMAC de una constante con la
 * contraseña como clave. No es por usuario (hay uno solo) y cambia si
 * cambia la contraseña, lo que cierra todas las sesiones.
 */
export function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("agent-admin-session").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(candidate: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && safeEqual(candidate, password);
}

export function isAdminCookie(value: string | undefined): boolean {
  const token = adminToken();
  return !!token && !!value && safeEqual(value, token);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  };
}
