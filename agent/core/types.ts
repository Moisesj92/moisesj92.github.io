import type { z } from "zod";
import type { AgentConfig } from "./config/schema";
import type { MessageStore } from "./storage/types";

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
  /** URL pública del proyecto, si la tiene (alimenta la tarjeta de `mostrar_proyectos`) */
  url?: string;
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
  documents: Document[];
  store: MessageStore;
  sessionId: string;
  /** hash del IP del visitante; solo lo usa el rate limit */
  ipHash: string;
}

/** Tarjeta de proyecto que la UI despliega mientras el agente habla. */
export interface ProjectCard {
  id: string;
  title: string;
  company?: string;
  period?: string;
  technologies: string[];
  url?: string;
  summary: string;
}

/** Efecto en la UI que acompaña al resultado de un tool. */
export type ToolUiEffect =
  | { kind: "project-cards"; cards: ProjectCard[] }
  | { kind: "download"; url: string; label: string };

export interface ToolResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  /** ids de los documentos que respaldan el resultado (atribución visible) */
  sources?: string[];
  /** lo que la UI debe mostrar; el modelo no lo ve */
  ui?: ToolUiEffect;
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
