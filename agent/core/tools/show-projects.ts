import { z } from "zod";
import type { Document, ProjectCard, Tool } from "../types";

const MAX_CARDS = 3;

const input = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1)
    .max(MAX_CARDS)
    .describe("ids de los proyectos de los que vas a hablar, tal como aparecen en la lista del prompt"),
});

/** Solo proyectos reales (type: project): una tarjeta tiene sentido si hay algo que abrir o mirar. */
export function showableProjects(documents: Document[]): Document[] {
  return documents.filter((d) => d.type === "project");
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
 * Efecto de UI sin efecto secundario: la página despliega las tarjetas
 * mientras el agente habla. Una sola llamada por turno, antes de hablar,
 * con todos los proyectos que se van a mencionar.
 */
export const showProjects: Tool<z.infer<typeof input>> = {
  name: "mostrar_proyectos",
  description:
    "Muestra en pantalla las tarjetas de uno o más proyectos mientras hablas de ellos. Llámala una sola vez por turno, antes de empezar a hablar, con los ids de todos los proyectos que vas a mencionar. Solo acepta ids de la lista de proyectos.",
  input,
  sideEffect: false,
  async run({ ids }, ctx) {
    const projects = showableProjects(ctx.documents);
    const found = ids.map((id) => projects.find((d) => d.id === id)).filter((d): d is Document => !!d);
    if (found.length === 0) {
      return {
        ok: false,
        error: `Ningún id válido. Ids de proyectos: ${projects.map((d) => d.id).join(", ")}`,
      };
    }
    const cards = found.map(toCard);
    return {
      ok: true,
      data: { mostrados: cards.map((c) => ({ id: c.id, titulo: c.title, resumen: c.summary, url: c.url })) },
      sources: found.map((d) => d.id),
      ui: { kind: "project-cards", cards },
    };
  },
};
