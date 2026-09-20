import { z } from "zod";

/**
 * Schema de `tenants/<id>/agent.yaml`. Todo lo configurable de un tenant
 * vive aquí; un `if (tenant === "x")` en código es un bug.
 * Claves en inglés, valores en el idioma del tenant (ADR-004).
 */
export const agentConfigSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "id: solo minúsculas, dígitos y guiones"),
  displayName: z.string().min(1),
  languages: z.array(z.string().min(2)).min(1),
  persona: z.string().min(1),
  refusalPhrase: z.string().min(1),
  voice: z.object({
    provider: z.enum(["gemini-live", "web-speech"]),
    model: z.string().min(1),
    voiceName: z.string().min(1),
    greeting: z.string().min(1),
  }),
  text: z.object({
    /** modelo para la ruta de texto: corpus, /debug y evals */
    model: z.string().min(1),
    /** si el principal responde 429/503 (cuota o saturación), se reintenta con este */
    fallbackModel: z.string().min(1).optional(),
  }),
  tools: z.array(z.string().min(1)).default([]),
  limits: z.object({
    sessionSeconds: z.number().int().positive(),
    warningAtSeconds: z.number().int().positive(),
  }),
  brand: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .default({ primaryColor: "#49bf9d" }),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
