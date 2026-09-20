import { describe, expect, it } from "vitest";
import { tokenize } from "../tokenize";

describe("tokenize", () => {
  it("quita acentos, mayúsculas y stopwords", () => {
    expect(tokenize("¿Dónde trabajó Arsenio con la pasarela de pago?")).toEqual([
      "trabajo",
      "arsenio",
      "pasarela",
      "pago",
    ]);
  });

  it("recorta plurales simples", () => {
    expect(tokenize("pasarelas de pagos")).toEqual(["pasarela", "pago"]);
  });

  it("conserva nombres de tecnologías con puntos y símbolos", () => {
    expect(tokenize("Node.js, Next.js y C#")).toEqual(["node.js", "next.js", "c#"]);
  });
});
