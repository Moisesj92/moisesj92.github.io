import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, adminCookieOptions, adminConfigured, adminToken, checkPassword } from "@/core/admin/auth";

export const runtime = "nodejs";

const bodySchema = z.object({ password: z.string().min(1).max(200) });

export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ error: "ADMIN_PASSWORD no configurada" }, { status: 503 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  // Un intento fallido tarda lo mismo que uno correcto y no dice por qué.
  if (!checkPassword(parsed.data.password)) {
    await new Promise((r) => setTimeout(r, 500));
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken()!, adminCookieOptions());
  return res;
}
