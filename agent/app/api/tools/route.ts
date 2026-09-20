import { NextResponse } from "next/server";
import { z } from "zod";
import { loadTenant, resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { NullRetriever } from "@/core/retrieval/null-retriever";
import { ToolRegistry, UnknownToolError } from "@/core/tools/registry";

export const runtime = "nodejs";

const bodySchema = z.object({
  tenant: z.string().optional(),
  sessionId: z.string().min(1),
  call: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    args: z.unknown().optional(),
  }),
});

/**
 * Ejecuta un tool en el servidor. El navegador solo transporta la llamada
 * y el resultado; el corpus y la lógica nunca lo tocan (ADR-002).
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  const { tenant, sessionId, call } = parsed.data;

  try {
    const config = await loadTenant(resolveTenantId(tenant));
    const registry = new ToolRegistry(config);
    if (!registry.has(call.name)) {
      return NextResponse.json(
        { error: `Tool desconocido: ${call.name}` },
        { status: 404 },
      );
    }
    const result = await registry.run(call.name, call.args ?? {}, {
      tenant: config,
      retriever: new NullRetriever(),
      sessionId,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof TenantNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof UnknownToolError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("[api/tools]", err);
    return NextResponse.json({ error: "Error ejecutando el tool" }, { status: 500 });
  }
}
