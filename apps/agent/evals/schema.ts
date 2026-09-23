import { z } from "zod";

/**
 * Un caso de eval: pregunta + lo que se espera. Las expectativas
 * deterministas se comprueban en código; `judge` es un criterio en
 * lenguaje natural que evalúa un LLM solo si está presente.
 */
export const caseSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  question: z.string().min(1),
  /** turnos previos, para casos multi-turno (p. ej. confirmar un mensaje) */
  history: z
    .array(z.object({ role: z.enum(["user", "agent"]), text: z.string() }))
    .default([]),
  expect: z
    .object({
      /** true: debe negarse / decir que no tiene la información. false: NO debe negarse. */
      refuse: z.boolean().optional(),
      /** subcadenas que deben aparecer (sin mayúsculas ni acentos); "a|b" = cualquiera de las dos */
      contains: z.array(z.string()).default([]),
      /** subcadenas que NO deben aparecer */
      not_contains: z.array(z.string()).default([]),
      /** al menos uno de estos documentos debe estar entre las fuentes */
      sources_any: z.array(z.string()).default([]),
      /** tools que deben haberse llamado */
      tools: z.array(z.string()).default([]),
      /** tools que NO deben haberse llamado */
      no_tools: z.array(z.string()).default([]),
      /** criterio para el juez LLM */
      judge: z.string().optional(),
    })
    .prefault({}),
});

export const caseFileSchema = z.object({
  /** grupo: "rechazo" cuenta para el umbral del 100 % */
  group: z.enum(["rechazo", "experiencia", "faq", "tools", "estilo"]),
  cases: z.array(caseSchema).min(1),
});

export type EvalCase = z.infer<typeof caseSchema> & { group: z.infer<typeof caseFileSchema>["group"] };

export const evalsConfigSchema = z.object({
  tenant: z.string().min(1),
  judgeModel: z.string().min(1),
  thresholds: z.object({
    /** fracción mínima de rechazos correctos (1 = todos) */
    rechazo: z.number().min(0).max(1),
    /** fracción mínima del resto */
    otros: z.number().min(0).max(1),
  }),
  concurrency: z.number().int().positive().default(1),
  /** separación mínima entre llamadas al modelo, para no chocar con el límite por minuto */
  minIntervalMs: z.number().int().nonnegative().default(4000),
});
export type EvalsConfig = z.infer<typeof evalsConfigSchema>;
