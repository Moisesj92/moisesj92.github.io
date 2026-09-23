import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, isAdminCookie } from "@/core/admin/auth";
import { getKillSwitch, setKillSwitch } from "@/core/guard/usage";

export const runtime = "nodejs";

const bodySchema = z.object({ value: z.enum(["", "voice", "text", "all"]) });

/** Kill-switch instantáneo: se guarda en la base y aplica en la siguiente petición. */
export async function POST(request: Request) {
  const jar = await cookies();
  if (!isAdminCookie(jar.get(ADMIN_COOKIE)?.value)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
  await setKillSwitch(parsed.data.value);
  console.warn(`[admin] kill-switch = "${parsed.data.value || "(apagado)"}"`);
  return NextResponse.json({ ok: true, value: await getKillSwitch() });
}
