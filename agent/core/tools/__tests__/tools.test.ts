import { describe, expect, it } from "vitest";
import { agentConfigSchema } from "../../config/schema";
import { BM25Retriever } from "../../retrieval/bm25";
import type { MessageStore, VisitorMessage } from "../../storage/types";
import type { Document, ToolContext } from "../../types";
import { ToolRegistry } from "../registry";

class FakeStore implements MessageStore {
  saved: VisitorMessage[] = [];
  async save(m: Omit<VisitorMessage, "id" | "createdAt">) {
    const s = { ...m, id: String(this.saved.length + 1), createdAt: new Date() };
    this.saved.push(s);
    return s;
  }
  async countSince(ipHash: string) {
    return this.saved.filter((m) => m.ipHash === ipHash).length;
  }
  async hasDuplicate(sessionId: string, email: string, body: string) {
    return this.saved.some((m) => m.sessionId === sessionId && m.email === email && m.body === body);
  }
  async listRecent() {
    return this.saved;
  }
}

const config = agentConfigSchema.parse({
  id: "t",
  displayName: "Persona Prueba",
  languages: ["es"],
  persona: "p",
  refusalPhrase: "no sé",
  voice: { provider: "gemini-live", model: "m", voiceName: "v", greeting: "hola" },
  text: { model: "m" },
  tools: ["buscar_experiencia", "mostrar_proyectos", "descargar_cv", "dejar_mensaje"],
  limits: { sessionSeconds: 10, warningAtSeconds: 5, messagesPerIpPerDay: 2 },
  links: { cvPdf: "https://example.com/cv.pdf" },
});

const documents: Document[] = [
  {
    id: "proy-a",
    title: "Proyecto A",
    type: "project",
    tags: ["a"],
    technologies: ["React"],
    url: "https://a.example",
    body: "Primer párrafo del proyecto A.\n\nSegundo párrafo.",
  },
  {
    id: "proy-b",
    title: "Proyecto B",
    type: "project",
    tags: ["b"],
    technologies: [],
    body: "Proyecto B sin URL.",
  },
  {
    id: "empleo",
    title: "Empleo",
    type: "situation",
    company: "Empresa",
    tags: ["x"],
    technologies: [],
    body: "cuerpo",
  },
];

function ctx(store = new FakeStore(), ipHash = "ip1"): ToolContext {
  return { tenant: config, retriever: new BM25Retriever(documents), documents, store, sessionId: "s", ipHash };
}

describe("mostrar_proyectos", () => {
  const registry = new ToolRegistry(config);
  it("devuelve una tarjeta por id, con el primer párrafo, en el orden pedido", async () => {
    const r = await registry.run("mostrar_proyectos", { ids: ["proy-b", "proy-a"] }, ctx());
    expect(r.ok).toBe(true);
    expect(r.sources).toEqual(["proy-b", "proy-a"]);
    expect(r.ui?.kind).toBe("project-cards");
    const cards = r.ui?.kind === "project-cards" ? r.ui.cards : [];
    expect(cards.map((c) => c.id)).toEqual(["proy-b", "proy-a"]);
    expect(cards[1]).toMatchObject({ title: "Proyecto A", url: "https://a.example", summary: "Primer párrafo del proyecto A." });
    expect(cards[0].url).toBeUndefined();
  });
  it("ignora ids que no son proyectos y falla si no queda ninguno", async () => {
    const mixed = await registry.run("mostrar_proyectos", { ids: ["empleo", "proy-a"] }, ctx());
    expect(mixed.sources).toEqual(["proy-a"]);
    const none = await registry.run("mostrar_proyectos", { ids: ["empleo"] }, ctx());
    expect(none.ok).toBe(false);
    expect(none.error).toContain("proy-a");
  });
  it("acepta como máximo tres ids", async () => {
    const r = await registry.run("mostrar_proyectos", { ids: ["a", "b", "c", "d"] }, ctx());
    expect(r.ok).toBe(false);
  });
});

describe("descargar_cv", () => {
  it("devuelve el enlace configurado", async () => {
    const r = await new ToolRegistry(config).run("descargar_cv", {}, ctx());
    expect(r.ui).toEqual({ kind: "download", url: "https://example.com/cv.pdf", label: "CV de Persona Prueba (PDF)" });
  });
});

describe("dejar_mensaje", () => {
  const registry = new ToolRegistry(config);
  const args = { nombre: "Ana", email: "ANA@Example.com ", texto: "Hola, <b>quiero</b> hablar contigo sobre un rol." };

  it("sanitiza y guarda", async () => {
    const store = new FakeStore();
    const r = await registry.run("dejar_mensaje", args, ctx(store));
    expect(r.ok).toBe(true);
    expect(store.saved[0]).toMatchObject({
      name: "Ana",
      email: "ana@example.com",
      body: "Hola, quiero hablar contigo sobre un rol.",
      ipHash: "ip1",
      tenant: "t",
    });
  });

  it("valida email y largo", async () => {
    const r = await registry.run("dejar_mensaje", { ...args, email: "no-es-correo" }, ctx());
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/email/);
    const r2 = await registry.run("dejar_mensaje", { ...args, texto: "corto" }, ctx());
    expect(r2.ok).toBe(false);
  });

  it("no duplica el mismo mensaje en la misma sesión", async () => {
    const store = new FakeStore();
    expect((await registry.run("dejar_mensaje", args, ctx(store))).ok).toBe(true);
    const again = await registry.run("dejar_mensaje", args, ctx(store));
    expect(again.ok).toBe(true);
    expect(store.saved).toHaveLength(1);
  });

  it("aplica el rate limit por IP", async () => {
    const store = new FakeStore();
    const distinct = (i: number) => ({ ...args, texto: `${args.texto} Variante ${i}.` });
    expect((await registry.run("dejar_mensaje", distinct(1), ctx(store))).ok).toBe(true);
    expect((await registry.run("dejar_mensaje", distinct(2), ctx(store))).ok).toBe(true);
    const third = await registry.run("dejar_mensaje", distinct(3), ctx(store));
    expect(third.ok).toBe(false);
    expect(third.error).toMatch(/máximo/);
    expect((await registry.run("dejar_mensaje", distinct(3), ctx(store, "otra-ip"))).ok).toBe(true);
  });
});
