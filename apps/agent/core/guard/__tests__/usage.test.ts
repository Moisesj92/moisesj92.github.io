import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentConfigSchema } from "../../config/schema";
import { checkAndRecordUsage } from "../usage";

const config = agentConfigSchema.parse({
  id: "t-guard",
  displayName: "Persona",
  languages: ["es"],
  persona: "p",
  scope: "una persona de prueba",
  refusalPhrase: "no sé",
  voice: { provider: "gemini-live", model: "m", voiceName: "v", greeting: "hola" },
  text: { model: "m" },
  ui: { intro: "intro" },
  limits: {
    sessionSeconds: 10,
    warningAtSeconds: 5,
    voiceSessionsPerIpPerDay: 2,
    textTurnsPerIpPerDay: 3,
    voiceSessionsPerDay: 4,
    textTurnsPerDay: 100,
  },
});

describe("checkAndRecordUsage", () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    delete process.env.AGENT_KILL_SWITCH;
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it("limita por IP y día", async () => {
    const ip = `ip-${Math.random()}`;
    expect((await checkAndRecordUsage(config, "voice_session", ip)).ok).toBe(true);
    expect((await checkAndRecordUsage(config, "voice_session", ip)).ok).toBe(true);
    const third = await checkAndRecordUsage(config, "voice_session", ip);
    expect(third).toMatchObject({ ok: false, reason: "rate_limit" });
    // otra IP sigue pudiendo
    expect((await checkAndRecordUsage(config, "voice_session", `ip-${Math.random()}`)).ok).toBe(true);
  });

  it("cierra el canal al llegar al presupuesto del tenant y avisa al 50 % y al 100 %", async () => {
    const cfg = { ...config, id: `t-${Math.random()}` };
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await checkAndRecordUsage(cfg, "voice_session", `ip-${i}`));
    expect(results.slice(0, 4).every((r) => r.ok)).toBe(true);
    expect(results[4]).toMatchObject({ ok: false, reason: "budget" });
    const alerts = (warn.mock.calls as unknown[][]).map((c) => String(c[0])).filter((m) => m.startsWith("[alert]"));
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toContain("50 %");
    expect(alerts[1]).toContain("100 %");
  });

  it("respeta el kill-switch por canal", async () => {
    process.env.AGENT_KILL_SWITCH = "voice";
    expect(await checkAndRecordUsage(config, "voice_session", "ip-k")).toMatchObject({ ok: false, reason: "kill_switch" });
    expect((await checkAndRecordUsage(config, "text_turn", "ip-k")).ok).toBe(true);
    process.env.AGENT_KILL_SWITCH = "all";
    expect(await checkAndRecordUsage(config, "text_turn", "ip-k2")).toMatchObject({ ok: false, reason: "kill_switch" });
  });
});
