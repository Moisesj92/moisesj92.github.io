import { describe, expect, it } from "vitest";
import { computeStats } from "../stats";
import type { StoredTurn } from "../types";

let id = 0;
function turn(sessionId: string, origin?: string): StoredTurn {
  return {
    id: ++id,
    tenant: "t",
    sessionId,
    channel: "text",
    userText: "¿Qué hizo en Alseco?",
    agentText: "…",
    tools: [],
    sources: [],
    refused: false,
    origin,
    createdAt: new Date(),
  };
}

describe("computeStats: sesiones por origen", () => {
  it("cuenta sesiones distintas, no turnos", () => {
    const stats = computeStats([turn("a", "acme"), turn("a", "acme"), turn("a", "acme"), turn("b", "acme")]);
    expect(stats.byOrigin).toEqual([{ origin: "acme", sessions: 2 }]);
  });

  it("agrupa las sesiones sin utm_source como «directo» y ordena de más a menos", () => {
    const stats = computeStats([turn("a"), turn("b", "acme"), turn("c", "acme"), turn("d", "linkedin")]);
    expect(stats.byOrigin).toEqual([
      { origin: "acme", sessions: 2 },
      { origin: "directo", sessions: 1 },
      { origin: "linkedin", sessions: 1 },
    ]);
  });

  it("toma el origen de la sesión aunque falte en algunos turnos", () => {
    const stats = computeStats([turn("a"), turn("a", "acme")]);
    expect(stats.byOrigin).toEqual([{ origin: "acme", sessions: 1 }]);
  });
});
