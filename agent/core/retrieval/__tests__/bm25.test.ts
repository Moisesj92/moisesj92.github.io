import { describe, expect, it } from "vitest";
import type { Document } from "../../types";
import { BM25Retriever } from "../bm25";

const doc = (id: string, over: Partial<Document>): Document => ({
  id,
  title: id,
  type: "situation",
  tags: [],
  technologies: [],
  body: "",
  ...over,
});

const docs = [
  doc("pagos", {
    title: "E-commerce con pasarela de pago",
    company: "Alseco",
    tags: ["e-commerce", "pagos"],
    technologies: ["Transbank"],
    body: "Integró la pasarela de pago Transbank en un e-commerce B2B.",
  }),
  doc("firma", {
    title: "Firma electrónica",
    company: "Docustore",
    tags: ["firma electrónica"],
    technologies: ["Ruby on Rails"],
    body: "Lideró la firma electrónica de liquidaciones con validez legal.",
  }),
  doc("mapas", {
    title: "Auditoría de mapas",
    company: "Position GPS",
    tags: ["google maps"],
    technologies: ["OpenStreetMap"],
    body: "Migró vistas de Google Maps a OpenStreetMap para reducir costos.",
  }),
];

describe("BM25Retriever", () => {
  const r = new BM25Retriever(docs);

  it("ordena por relevancia", async () => {
    const res = await r.search("experiencia con pasarelas de pago", 3);
    expect(res[0]?.id).toBe("pagos");
  });

  it("filtra por tag/tecnología/empresa cuando la consulta coincide con uno", async () => {
    const res = await r.search("qué hizo en Docustore", 3);
    expect(res.map((d) => d.id)).toEqual(["firma"]);
  });

  it("cae a todos los documentos cuando ningún facet coincide", async () => {
    const res = await r.search("reducir costos", 3);
    expect(res[0]?.id).toBe("mapas");
  });

  it("devuelve vacío sin términos útiles o sin coincidencias", async () => {
    expect(await r.search("de la con", 3)).toEqual([]);
    expect(await r.search("kubernetes", 3)).toEqual([]);
  });

  it("respeta el límite", async () => {
    const res = await r.search("electrónica pago mapas", 2);
    expect(res).toHaveLength(2);
  });
});
