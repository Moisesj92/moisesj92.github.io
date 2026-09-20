import { z } from "zod";
import type { Tool } from "../types";

const input = z.object({});

/** Dispara la descarga del CV. El PDF vive fuera (repo cv); aquí solo va el enlace. */
export const downloadCv: Tool<z.infer<typeof input>> = {
  name: "descargar_cv",
  description:
    "Ofrece al visitante el CV en PDF: la página muestra el botón de descarga. Úsala cuando pidan el CV, el currículum o un resumen para llevarse.",
  input,
  sideEffect: false,
  async run(_input, ctx) {
    const url = ctx.tenant.links.cvPdf;
    if (!url) {
      return { ok: false, error: "Este perfil no tiene un CV en PDF configurado." };
    }
    return {
      ok: true,
      data: { url, nota: "La página ya muestra el botón de descarga; dile al visitante que lo tiene en pantalla." },
      ui: { kind: "download", url, label: `CV de ${ctx.tenant.displayName} (PDF)` },
    };
  },
};
