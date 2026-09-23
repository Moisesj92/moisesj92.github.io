import { describe, expect, it } from "vitest";
import { parseDocument } from "../schema";

const valid = `---
id: doc-uno
title: Un documento
type: situation
tags: [a, b]
technologies: [React]
---
Cuerpo del documento.
`;

describe("parseDocument", () => {
  it("parsea un documento válido", () => {
    const d = parseDocument(valid, "doc-uno.md");
    expect(d.id).toBe("doc-uno");
    expect(d.tags).toEqual(["a", "b"]);
    expect(d.body).toBe("Cuerpo del documento.");
  });

  it("rechaza sin frontmatter", () => {
    expect(() => parseDocument("solo texto", "x.md")).toThrow(/frontmatter/);
  });

  it("rechaza frontmatter incompleto con el detalle de Zod", () => {
    expect(() => parseDocument(valid.replace("tags: [a, b]\n", ""), "x.md")).toThrow(/tags/);
  });

  it("rechaza un type desconocido", () => {
    expect(() => parseDocument(valid.replace("situation", "otro"), "x.md")).toThrow(/type/);
  });

  it("rechaza cuerpo vacío", () => {
    expect(() => parseDocument(valid.replace("Cuerpo del documento.", ""), "x.md")).toThrow(/vacío/);
  });
});
