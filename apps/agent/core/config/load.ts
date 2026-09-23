import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import { agentConfigSchema, type AgentConfig } from "./schema";

export class TenantNotFoundError extends Error {
  constructor(id: string) {
    super(`Tenant no encontrado: ${id}`);
    this.name = "TenantNotFoundError";
  }
}

const TENANT_ID = /^[a-z0-9-]+$/;
const cache = new Map<string, Promise<AgentConfig>>();

function tenantsDir(): string {
  return path.join(process.cwd(), "tenants");
}

/**
 * Carga y valida `tenants/<id>/agent.yaml`. Un YAML inválido lanza con el
 * detalle de Zod: debe romper el arranque, nunca fallar en silencio.
 */
export function loadTenant(id: string): Promise<AgentConfig> {
  if (!TENANT_ID.test(id)) {
    return Promise.reject(new TenantNotFoundError(id));
  }
  let pending = cache.get(id);
  if (!pending) {
    pending = readTenant(id).catch((err) => {
      cache.delete(id);
      throw err;
    });
    cache.set(id, pending);
  }
  return pending;
}

async function readTenant(id: string): Promise<AgentConfig> {
  const file = path.join(tenantsDir(), id, "agent.yaml");
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    throw new TenantNotFoundError(id);
  }
  const parsed = agentConfigSchema.safeParse(parse(raw));
  if (!parsed.success) {
    throw new Error(
      `agent.yaml inválido para tenant "${id}":\n${parsed.error.issues
        .map((i) => `  - ${i.path.join(".") || "(raíz)"}: ${i.message}`)
        .join("\n")}`,
    );
  }
  if (parsed.data.id !== id) {
    throw new Error(
      `agent.yaml de "${id}" declara id "${parsed.data.id}"; deben coincidir`,
    );
  }
  return parsed.data;
}

/**
 * Resuelve el tenant de una petición. Hoy: body → DEFAULT_TENANT. Cuando
 * exista un segundo tenant, aquí se agrega subdominio o path sin tocar a
 * los llamadores.
 */
export function resolveTenantId(requested?: string | null): string {
  const id = requested?.trim() || process.env.DEFAULT_TENANT;
  if (!id) {
    throw new TenantNotFoundError("(sin tenant y sin DEFAULT_TENANT)");
  }
  return id;
}
