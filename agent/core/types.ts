import type { z } from "zod";
import type { AgentConfig } from "./config/schema";

/**
 * Un documento del corpus de un tenant. Se carga desde Markdown con
 * frontmatter (Fase 1); aquí solo vive el contrato.
 */
export interface Document {
  id: string;
  title: string;
  company?: string;
  period?: string;
  role?: string;
  tags: string[];
  technologies: string[];
  type: "situation" | "project" | "hard-fact" | "faq";
  body: string;
}

/**
 * Recuperación de documentos. Esta firma no cambia: BM25 hoy, pgvector
 * mañana, es cambiar el cuerpo de una implementación.
 */
export interface Retriever {
  search(query: string, limit: number): Promise<Document[]>;
}

export interface ToolContext {
  tenant: AgentConfig;
  retriever: Retriever;
  sessionId: string;
}

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  /** ids de los documentos que respaldan el resultado (atribución visible, Fase 2) */
  sources?: string[];
}

/**
 * Un tool que el modelo puede invocar. Corre siempre en el servidor.
 * `input` es la única fuente de verdad: valida los argumentos y genera el
 * JSON Schema que ve el modelo.
 */
export interface Tool<I = unknown> {
  /** nombre que ve el modelo, en español: "buscar_experiencia" */
  name: string;
  description: string;
  input: z.ZodType<I>;
  /** solo `dejar_mensaje` será true; el registry lo deja registrado */
  sideEffect: boolean;
  run(input: I, ctx: ToolContext): Promise<ToolResult>;
}
