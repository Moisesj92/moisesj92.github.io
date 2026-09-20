import { NextResponse } from "next/server";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { getTenantRuntime } from "@/core/runtime";

export const runtime = "nodejs";

/** Lo público del tenant que la página necesita antes de abrir sesión: nombre, marca, enlaces. */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("tenant");
  try {
    const { config } = await getTenantRuntime(resolveTenantId(requested));
    return NextResponse.json(
      {
        id: config.id,
        displayName: config.displayName,
        languages: config.languages,
        brand: config.brand,
        links: config.links,
        greeting: config.voice.greeting,
      },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (err) {
    if (err instanceof TenantNotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    console.error("[api/tenant]", err);
    return NextResponse.json({ error: "No disponible" }, { status: 500 });
  }
}
