import { z } from "zod";
import type { Tool } from "../types";

const input = z.object({
  consulta: z
    .string()
    .min(1)
    .describe(
      "Lo que el visitante quiere saber, en lenguaje natural y SIEMPRE EN ESPAÑOL aunque el visitante escriba en otro idioma (los documentos están en español). Ej.: 'experiencia con pasarelas de pago', 'por qué dejó Alseco'.",
    ),
});

const LIMIT = 4;

/**
 * Único tool de lectura. Devuelve los documentos del corpus que mejor
 * responden la consulta; el modelo redacta a partir de ellos y solo de
 * ellos.
 */
export const searchExperience: Tool<z.infer<typeof input>> = {
  name: "buscar_experiencia",
  description:
    "Busca en la información verificada sobre la persona: experiencia laboral, proyectos, decisiones técnicas, tecnologías y respuestas a preguntas frecuentes. Llámala siempre antes de afirmar algo sobre ella.",
  input,
  sideEffect: false,
  async run({ consulta }, ctx) {
    const docs = await ctx.retriever.search(consulta, LIMIT);
    return {
      ok: true,
      data: {
        documentos: docs.map((d) => ({
          id: d.id,
          titulo: d.title,
          empresa: d.company,
          periodo: d.period,
          contenido: d.body,
        })),
        nota:
          docs.length === 0
            ? "Sin resultados. No hay información verificada sobre esto; usa la frase de rechazo."
            : undefined,
      },
      sources: docs.map((d) => d.id),
    };
  },
};
