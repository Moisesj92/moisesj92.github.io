import { describe, expect, it } from "vitest";
import { originSchema } from "../origin";

describe("originSchema", () => {
  it("acepta slugs y los pasa a minúsculas", () => {
    expect(originSchema.parse("Acme-Corp")).toBe("acme-corp");
    expect(originSchema.parse("linkedin.post_2")).toBe("linkedin.post_2");
  });

  it("descarta en vez de fallar lo que podría terminar mal en /admin", () => {
    expect(originSchema.parse("<script>alert(1)</script>")).toBeUndefined();
    expect(originSchema.parse("a b")).toBeUndefined();
    expect(originSchema.parse("x".repeat(65))).toBeUndefined();
    expect(originSchema.parse(42)).toBeUndefined();
  });

  it("es opcional", () => {
    expect(originSchema.parse(undefined)).toBeUndefined();
  });
});
