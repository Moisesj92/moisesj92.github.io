import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { getTenantRuntime } from "@/core/runtime";
import { logTurn } from "@/core/observability/turn-log";

export const runtime = "nodejs";

const bodySchema = z.object({
  tenant: z.string().optional(),
  sessionId: z.string().min(1).max(64),
  user: z.string().max(2000).default(""),
  agent: z.string().max(4000).default(""),
  tools: z.array(z.object({ name: z.string().max(64), ok: z.boolean(), ms: z.number().optional() })).max(10).default([]),
  sources: z.array(z.string().max(64)).max(20).default([]),
  ms: z.number().optional(),
});

/**
 * La voz va directo del navegador a Gemini (ADR-002), así que las
 * transcripciones de cada turno se reportan aquí al terminar. Sin audio.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  try {
    const { config } = await getTenantRuntime(resolveTenantId(parsed.data.tenant));
    const { sessionId, user, agent, tools, sources, ms } = parsed.data;
    logTurn({
      channel: "voice",
      tenant: config.id,
      sessionId,
      user,
      agent,
      tools,
      sources,
      ms,
      refused: agent.includes(config.refusalPhrase),
    });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return NextResponse.json({ error: err.message }, { status: 400 });
    return new NextResponse(null, { status: 204 });
  }
}
