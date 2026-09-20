import { z } from "zod";
import { parse } from "yaml";
import type { Document } from "../types";

/**
 * Frontmatter de cada documento del corpus. Un doc mal formado rompe el
 * arranque, no falla en silencio en producción.
 */
export const frontmatterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, "id: solo minúsculas, dígitos y guiones"),
  title: z.string().min(1),
  type: z.enum(["situation", "project", "hard-fact", "faq"]),
  company: z.string().min(1).optional(),
  period: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).min(1, "tags: al menos uno"),
  technologies: z.array(z.string().min(1)).default([]),
  url: z.string().url().optional(),
});

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export class CorpusDocumentError extends Error {
  constructor(file: string, detail: string) {
    super(`Documento inválido ${file}:\n${detail}`);
    this.name = "CorpusDocumentError";
  }
}

/** Parsea un `.md` con frontmatter YAML en un Document validado. */
export function parseDocument(raw: string, file: string): Document {
  const m = FRONTMATTER.exec(raw);
  if (!m) throw new CorpusDocumentError(file, "  - falta el bloque frontmatter (--- ... ---)");

  let data: unknown;
  try {
    data = parse(m[1]);
  } catch (err) {
    throw new CorpusDocumentError(file, `  - YAML inválido: ${(err as Error).message}`);
  }
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new CorpusDocumentError(
      file,
      parsed.error.issues
        .map((i) => `  - ${i.path.join(".") || "(raíz)"}: ${i.message}`)
        .join("\n"),
    );
  }
  const body = m[2].trim();
  if (!body) throw new CorpusDocumentError(file, "  - el cuerpo está vacío");
  return { ...parsed.data, body };
}
