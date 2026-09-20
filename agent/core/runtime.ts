import type { AgentConfig } from "./config/schema";
import { loadTenant } from "./config/load";
import { loadCorpus, loadIdentity } from "./corpus/load";
import { BM25Retriever } from "./retrieval/bm25";
import { ToolRegistry } from "./tools/registry";
import type { Document, Retriever } from "./types";

/** Todo lo que un tenant necesita en runtime, construido una vez por proceso. */
export interface TenantRuntime {
  config: AgentConfig;
  identity: string | null;
  documents: Document[];
  retriever: Retriever;
  registry: ToolRegistry;
}

const cache = new Map<string, Promise<TenantRuntime>>();

/** En desarrollo el corpus se edita en caliente; se reconstruye en cada petición. */
const CACHE = process.env.NODE_ENV === "production";

export function getTenantRuntime(tenantId: string): Promise<TenantRuntime> {
  if (!CACHE) return build(tenantId);
  let pending = cache.get(tenantId);
  if (!pending) {
    pending = build(tenantId).catch((err) => {
      cache.delete(tenantId);
      throw err;
    });
    cache.set(tenantId, pending);
  }
  return pending;
}

async function build(tenantId: string): Promise<TenantRuntime> {
  const config = await loadTenant(tenantId);
  const [identity, documents] = await Promise.all([loadIdentity(tenantId), loadCorpus(tenantId)]);
  return {
    config,
    identity,
    documents,
    retriever: new BM25Retriever(documents),
    registry: new ToolRegistry(config),
  };
}
