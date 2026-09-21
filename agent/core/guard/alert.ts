import nodemailer from "nodemailer";

/**
 * Alerta operativa. Dos canales, ambos opcionales y sin instalar nada:
 *
 * - Correo: SMTP_URL + ALERT_EMAIL_TO. Con Gmail basta una "contraseña de
 *   aplicación": smtps://usuario@gmail.com:CONTRASEÑA@smtp.gmail.com:465.
 *   También sirve smtp.resend.com o cualquier SMTP.
 * - Webhook: ALERT_WEBHOOK_URL (ntfy.sh, Slack, Discord).
 *
 * Sin variables, solo queda en el log. Nunca lanza: una alerta que falla
 * no debe tumbar la petición.
 */
export async function sendAlert(title: string, message: string): Promise<void> {
  console.warn(`[alert] ${title} — ${message}`);
  await Promise.all([sendEmail(title, message), sendWebhook(title, message)]);
}

async function sendEmail(title: string, message: string): Promise<void> {
  const url = process.env.SMTP_URL;
  const to = process.env.ALERT_EMAIL_TO;
  if (!url || !to) return;
  try {
    const transport = nodemailer.createTransport(url);
    const from = process.env.ALERT_EMAIL_FROM ?? new URL(url).username;
    await transport.sendMail({
      from: `Agente de voz <${decodeURIComponent(from)}>`,
      to,
      subject: `[agente] ${title}`,
      text: `${message}\n\n— Enviado por el guardián de presupuesto del agente.`,
    });
  } catch (err) {
    console.warn("[alert] correo no enviado:", err instanceof Error ? err.message : err);
  }
}

async function sendWebhook(title: string, message: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    const isNtfy = url.includes("ntfy");
    await fetch(url, {
      method: "POST",
      headers: isNtfy
        ? { "content-type": "text/plain; charset=utf-8", Title: title.normalize("NFD").replace(/[̀-ͯ]/g, "") }
        : { "content-type": "application/json" },
      body: isNtfy ? message : JSON.stringify({ text: `${title}\n${message}`, content: `${title}\n${message}` }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn("[alert] webhook no enviado:", err instanceof Error ? err.message : err);
  }
}
