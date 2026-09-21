import { ApiError } from "@google/genai";
import { NextResponse } from "next/server";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { checkAndRecordUsage } from "@/core/guard/usage";
import { getTenantRuntime } from "@/core/runtime";
import { createSessionGrant } from "@/core/session/grant";
import { hashIp, requestIp } from "@/core/session/visitor";

export const runtime = "nodejs";

/**
 * Emite un token efímero de Gemini para abrir una sesión de voz desde el
 * navegador (ADR-002). La API key solo existe aquí.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY no configurada en el servidor" },
      { status: 503 },
    );
  }

  let requested: string | undefined;
  try {
    const body = (await request.json().catch(() => ({}))) as { tenant?: unknown };
    requested = typeof body.tenant === "string" ? body.tenant : undefined;
    const runtime = await getTenantRuntime(resolveTenantId(requested));
    const usage = await checkAndRecordUsage(runtime.config, "voice_session", hashIp(requestIp(request)));
    if (!usage.ok) {
      return NextResponse.json(
        { error: usage.message, reason: usage.reason },
        { status: usage.reason === "rate_limit" ? 429 : 503, headers: { "Retry-After": String(usage.retryAfterSeconds) } },
      );
    }
    const grant = await createSessionGrant(runtime, apiKey);
    return NextResponse.json(grant, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof TenantNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ApiError && (err.status === 429 || err.status === 503)) {
      // Cuota agotada o modelo saturado: la voz no está; el texto sigue (cascada de degradación).
      console.warn("[api/session] voz no disponible:", err.status);
      return NextResponse.json(
        { error: "La voz no está disponible en este momento", reason: "quota" },
        { status: 503, headers: { "Retry-After": "60" } },
      );
    }
    console.error("[api/session]", err);
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión de voz" },
      { status: 502 },
    );
  }
}
