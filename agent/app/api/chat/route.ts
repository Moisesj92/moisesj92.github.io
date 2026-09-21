import { NextResponse } from "next/server";
import { z } from "zod";
import { ModelUnavailableError, runTextTurn } from "@/core/chat/text";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { checkAndRecordUsage } from "@/core/guard/usage";
import { logTurn } from "@/core/observability/turn-log";
import { getTenantRuntime } from "@/core/runtime";
import { hashIp, requestIp } from "@/core/session/visitor";

export const runtime = "nodejs";

const bodySchema = z.object({
  tenant: z.string().optional(),
  sessionId: z.string().min(1).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "agent"]), text: z.string() }))
    .max(40)
    .default([]),
  message: z.string().min(1).max(2000),
});

/**
 * Fallback de texto con la misma calidad que la voz: mismo prompt, mismos
 * tools, mismo retriever. Devuelve además los pasos de tools y los
 * documentos usados, que es lo que muestra /debug.
 */
export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada en el servidor" }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const { tenant, history, message } = parsed.data;
  const sessionId = parsed.data.sessionId ?? crypto.randomUUID();

  try {
    const rt = await getTenantRuntime(resolveTenantId(tenant));
    const ipHash = hashIp(requestIp(request));
    const usage = await checkAndRecordUsage(rt.config, "text_turn", ipHash);
    if (!usage.ok) {
      return NextResponse.json(
        { error: usage.message, reason: usage.reason },
        { status: usage.reason === "rate_limit" ? 429 : 503, headers: { "Retry-After": String(usage.retryAfterSeconds) } },
      );
    }
    const started = performance.now();
    const turn = await runTextTurn(rt, apiKey, history, message, sessionId, ipHash);
    logTurn({
      channel: "text",
      tenant: rt.config.id,
      sessionId,
      user: message,
      agent: turn.text,
      tools: turn.steps.map((s) => ({ name: s.name, ok: s.result.ok, ms: s.ms })),
      sources: turn.sources,
      model: turn.model,
      ms: Math.round(performance.now() - started),
      refused: turn.text.includes(rt.config.refusalPhrase),
    });
    return NextResponse.json({ sessionId, ...turn }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof TenantNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof ModelUnavailableError) {
      return NextResponse.json({ error: err.message }, { status: 503, headers: { "Retry-After": "5" } });
    }
    console.error("[api/chat]", err);
    return NextResponse.json({ error: "No se pudo responder" }, { status: 502 });
  }
}
