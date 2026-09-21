import { NextResponse } from "next/server";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { getTenantRuntime } from "@/core/runtime";
import { tenantPublic } from "@/core/tenant/public";

export const runtime = "nodejs";

/** Lo público del tenant que la página necesita antes de abrir sesión. */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("tenant");
  try {
    const id = resolveTenantId(requested);
    const { config } = await getTenantRuntime(id);
    return NextResponse.json(tenantPublic(config, id === resolveTenantId(null)), {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    console.error("[api/tenant]", err);
    return NextResponse.json({ error: "No disponible" }, { status: 500 });
  }
}
