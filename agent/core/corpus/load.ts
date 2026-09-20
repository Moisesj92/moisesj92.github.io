import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Document } from "../types";
import { CorpusDocumentError, parseDocument } from "./schema";

function tenantDir(id: string): string {
  return path.join(process.cwd(), "tenants", id);
}

/** Archivos y carpetas con `_` al inicio son borradores: no entran al corpus. */
function isDraft(name: string): boolean {
  return name.startsWith("_");
}

async function listMarkdown(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files: string[] = [];
  for (const e of entries) {
    if (isDraft(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await listMarkdown(full)));
    else if (e.isFile() && e.name.endsWith(".md")) files.push(full);
  }
  return files.sort();
}

/**
 * Carga `tenants/<id>/corpus/**\/*.md`. Valida cada documento y que los ids
 * sean únicos. Lanza al primer error: el corpus es contenido versionado y
 * un error aquí es un bug del commit, no una condición de runtime.
 */
export async function loadCorpus(tenantId: string): Promise<Document[]> {
  const dir = path.join(tenantDir(tenantId), "corpus");
  const files = await listMarkdown(dir);
  const docs: Document[] = [];
  const seen = new Map<string, string>();
  for (const file of files) {
    const rel = path.relative(dir, file);
    const doc = parseDocument(await readFile(file, "utf8"), rel);
    const dup = seen.get(doc.id);
    if (dup) {
      throw new CorpusDocumentError(rel, `  - id "${doc.id}" repetido (ya está en ${dup})`);
    }
    seen.set(doc.id, rel);
    docs.push(doc);
  }
  return docs;
}

/**
 * Capa 0: `tenants/<id>/identity.md`, la ficha fija que va al inicio del
 * system prompt. Opcional; sin ella el agente solo tiene la persona.
 */
export async function loadIdentity(tenantId: string): Promise<string | null> {
  try {
    const raw = await readFile(path.join(tenantDir(tenantId), "identity.md"), "utf8");
    return raw.trim() || null;
  } catch {
    return null;
  }
}
