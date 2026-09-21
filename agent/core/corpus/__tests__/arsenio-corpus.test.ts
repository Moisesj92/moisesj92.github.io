import { describe, expect, it } from "vitest";
import { loadCorpus, loadIdentity } from "../load";
import { BM25Retriever } from "../../retrieval/bm25";

/**
 * El corpus real del tenant es contenido versionado: si un documento está
 * mal formado o el retriever deja de encontrar lo obvio, debe fallar aquí,
 * no en producción.
 */
describe("corpus de arsenio", () => {
  it("carga y valida todos los documentos", async () => {
    const docs = await loadCorpus("arsenio");
    expect(docs.length).toBeGreaterThanOrEqual(10);
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });

  it("incluye los \"no\" (faq)", async () => {
    const docs = await loadCorpus("arsenio");
    expect(docs.filter((d) => d.type === "faq").length).toBeGreaterThanOrEqual(8);
  });

  it("tiene capa 0 corta", async () => {
    const identity = await loadIdentity("arsenio");
    expect(identity).toBeTruthy();
    // ~2k tokens ≈ 8k caracteres; la ficha debe caber en caché de prefijo.
    expect(identity!.length).toBeLessThan(8000);
  });

  it("recupera lo obvio", async () => {
    const r = new BM25Retriever(await loadCorpus("arsenio"));
    const top = async (q: string) => (await r.search(q, 3)).map((d) => d.id);

    expect((await top("pasarelas de pago"))[0]).toBe("alseco-ecommerce-b2b");
    expect((await top("firma electrónica de liquidaciones"))[0]).toBe("docustore-firma-electronica");
    expect((await top("qué hace en la planta de residuos"))[0]).toMatch(/bendito-residuo|planta-residuos/);
    expect((await top("google maps"))[0]).toBe("position-gps-mapas-plataformas");
    expect((await top("kubernetes"))[0]).toBe("faq-tecnologias-no-usadas");
    expect((await top("cuánto espera ganar"))[0]).toBe("faq-expectativa-renta");
    expect((await top("por qué dejó Comunidad Feliz"))[0]).toBe("faq-salida-comunidad-feliz");
    expect((await top("por qué se fue de Position GPS"))[0]).toBe("faq-salida-position-gps");
  });
});
