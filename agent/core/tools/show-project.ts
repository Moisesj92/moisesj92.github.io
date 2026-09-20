import { z } from "zod";
import type { Document, ProjectCard, Tool } from "../types";

const input = z.object({
  id: z.string().min(1).describe("id del proyecto, tal como aparece en la lista de proyectos del prompt"),
});

/** Qué documentos pueden mostrarse como tarjeta: proyectos y situaciones con empresa. */
export function showableProjects(documents: Document[]): Document[] {
  return documents.filter((d) => d.type === "project" || (d.type === "situation" && d.company));
}

export function toCard(d: Document): ProjectCard {
  return {
    id: d.id,
    title: d.title,
    company: d.company,
    period: d.period,
    technologies: d.technologies,
    url: d.url,
    summary: d.body.split(/\n\s*\n/)[0].trim(),
  };
}

/**
 * Efecto de UI sin efecto secundario: la página despliega la tarjeta
 * mientras el agente lo cuenta. El modelo recibe el resumen para que voz
 * y tarjeta digan lo mismo.
 */
export const showProject: Tool<z.infer<typeof input>> = {
  name: "mostrar_proyecto",
  description:
    "Muestra en pantalla la tarjeta de un proyecto o trabajo mientras hablas de él. Úsala cuando el visitante pregunte por un proyecto o empresa concretos, o cuando tú lo menciones. Solo acepta los ids de la lista de proyectos.",
  input,
  sideEffect: false,
  async run({ id }, ctx) {
    const doc = showableProjects(ctx.documents).find((d) => d.id === id);
    if (!doc) {
      return {
        ok: false,
        error: `No existe el proyecto "${id}". Ids válidos: ${showableProjects(ctx.documents)
          .map((d) => d.id)
          .join(", ")}`,
      };
    }
    const card = toCard(doc);
    return {
      ok: true,
      data: { mostrado: card.title, resumen: card.summary, url: card.url },
      sources: [doc.id],
      ui: { kind: "project-card", card },
    };
  },
};
