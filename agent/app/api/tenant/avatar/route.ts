import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { resolveTenantId, TenantNotFoundError } from "@/core/config/load";
import { getTenantRuntime } from "@/core/runtime";

export const runtime = "nodejs";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", svg: "image/svg+xml" };

/** Sirve tenants/<id>/<brand.avatar>. El nombre viene validado por el schema (sin rutas). */
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("tenant");
  try {
    const id = resolveTenantId(requested);
    const { config } = await getTenantRuntime(id);
    const file = config.brand.avatar;
    if (!file) return new NextResponse(null, { status: 404 });
    const body = await readFile(path.join(process.cwd(), "tenants", id, file));
    const ext = file.split(".").pop() ?? "";
    return new NextResponse(body, {
      headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    if (err instanceof TenantNotFoundError) return new NextResponse(null, { status: 404 });
    console.error("[api/tenant/avatar]", err);
    return new NextResponse(null, { status: 500 });
  }
}
