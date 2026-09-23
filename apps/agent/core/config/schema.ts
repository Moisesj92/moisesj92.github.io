import { z } from "zod";

/**
 * Schema de `tenants/<id>/agent.yaml`. Todo lo configurable de un tenant
 * vive aquí; un `if (tenant === "x")` en código es un bug.
 * Claves en inglés, valores en el idioma del tenant (ADR-004).
 */
export const agentConfigSchema = z.strictObject({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "id: solo minúsculas, dígitos y guiones"),
  displayName: z.string().min(1),
  languages: z.array(z.string().min(2)).min(1),
  persona: z.string().min(1),
  /**
   * De qué habla el agente (regla 1 del prompt). Una persona: "X: su
   * experiencia, proyectos y forma de trabajar". Una empresa: sus productos,
   * precios y políticas. Fuera de esto, rechaza.
   */
  scope: z.string().min(1),
  refusalPhrase: z.string().min(1),
  voice: z.strictObject({
    provider: z.enum(["gemini-live", "web-speech"]),
    model: z.string().min(1),
    voiceName: z.string().min(1),
    greeting: z.string().min(1),
  }),
  text: z.strictObject({
    /** modelo para la ruta de texto: corpus, /debug y evals */
    model: z.string().min(1),
    /** si el principal responde 429/503 (cuota o saturación), se reintenta con este */
    fallbackModel: z.string().min(1).optional(),
  }),
  tools: z.array(z.string().min(1)).default([]),
  /** Textos de la interfaz que dependen del tenant. */
  ui: z
    .strictObject({
      /** párrafo bajo el título de la página principal */
      intro: z.string().min(1),
      /** cómo se llaman las tarjetas que muestra mostrar_proyectos: "proyectos", "vuelos"… */
      cardsLabel: z.string().min(1).default("proyectos"),
    }),
  limits: z.strictObject({
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
    .strictObject({
      /** PDF del CV que descarga `descargar_cv` */
      cvPdf: z.string().url().optional(),
      /** correo para ejercer derechos sobre los datos (aviso de privacidad) */
      contactEmail: z.string().email().optional(),
      /** sitio principal al que enlazan el avatar y el pie */
      website: z.string().url().optional(),
    })
    .default({}),
  /** Textos legales del aviso de privacidad. */
  legal: z
    .strictObject({
      /** quién responde del tratamiento de datos (persona natural o empresa) */
      responsible: z.string().min(1).optional(),
    })
    .default({}),
  brand: z
    .strictObject({
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      /** archivo dentro de tenants/<id>/ (jpg, png o svg); sin él, la UI usa el avatar por defecto */
      avatar: z.string().regex(/^[a-z0-9-]+\.(jpg|jpeg|png|svg)$/).optional(),
    })
    .default({ primaryColor: "#14b8a6" }),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
