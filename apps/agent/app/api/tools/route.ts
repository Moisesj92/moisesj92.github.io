import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { getTenantRuntime, toolContext } from "@/core/runtime";
import { hashIp, requestIp } from "@/core/session/visitor";
import { UnknownToolError } from "@/core/tools/registry";
import { originSchema } from "@/core/observability/origin";

export const runtime = "nodejs";

const bodySchema = z.object({
  tenant: z.string().optional(),
  sessionId: z.string().min(1),
  origin: originSchema,
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
  const { tenant, sessionId, call, origin } = parsed.data;

  try {
    const rt = await getTenantRuntime(resolveTenantId(tenant));
    const { registry } = rt;
    if (!registry.has(call.name)) {
      return NextResponse.json(
        { error: `Tool desconocido: ${call.name}` },
        { status: 404 },
      );
    }
    const result = await registry.run(
      call.name,
      call.args ?? {},
      toolContext(rt, sessionId, hashIp(requestIp(request)), origin),
    );
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
