import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// nodemailer se sustituye por un transporte que solo captura el mensaje.
const sent: { to?: string; subject?: string; text?: string }[] = [];
vi.mock("nodemailer", () => ({
  default: {
    createTransport: () => ({
      sendMail: async (m: { to?: string; subject?: string; text?: string }) => {
        sent.push(m);
      },
    }),
  },
}));

import { sendAlert } from "../alert";

describe("sendAlert", () => {
  beforeEach(() => {
    sent.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
    delete process.env.ALERT_WEBHOOK_URL;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SMTP_URL;
    delete process.env.ALERT_EMAIL_TO;
  });

  it("envía correo cuando hay SMTP_URL y ALERT_EMAIL_TO", async () => {
    process.env.SMTP_URL = "smtps://yo%40gmail.com:clave@smtp.gmail.com:465";
    process.env.ALERT_EMAIL_TO = "yo@gmail.com";
    await sendAlert("voz al 50 %", "30/60 sesiones");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: "yo@gmail.com", subject: "[agente] voz al 50 %" });
    expect(sent[0].text).toContain("30/60");
  });

  it("sin configuración solo deja el log y no falla", async () => {
    await expect(sendAlert("t", "m")).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
  });
});
