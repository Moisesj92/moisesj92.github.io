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
    /** mensajes de `dejar_mensaje` por IP y día */
    messagesPerIpPerDay: z.number().int().positive().default(3),
    /** tokens de voz por IP y día (un precalentado sin usar también cuenta) */
    voiceSessionsPerIpPerDay: z.number().int().positive().default(10),
    /** turnos de texto por IP y día */
    textTurnsPerIpPerDay: z.number().int().positive().default(40),
    /** presupuesto diario del tenant: al llegar, el canal se cierra solo (kill-switch automático) */
    voiceSessionsPerDay: z.number().int().positive().default(60),
    textTurnsPerDay: z.number().int().positive().default(300),
  }),
  links: z
    .object({
      /** PDF del CV que descarga `descargar_cv` */
      cvPdf: z.string().url().optional(),
      /** correo para ejercer derechos sobre los datos (aviso de privacidad) */
      contactEmail: z.string().email().optional(),
    })
    .default({}),
  brand: z
    .object({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    })
    .default({ primaryColor: "#14b8a6" }),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
