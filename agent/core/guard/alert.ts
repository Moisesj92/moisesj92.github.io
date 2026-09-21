/**
 * Alerta operativa por webhook. Sin correo ni cuentas: con ALERT_WEBHOOK_URL
 * apuntando a un topic de ntfy.sh llega como notificación push; también
 * sirve un webhook de Slack o Discord. Sin la variable, solo queda en el log.
 * Nunca lanza: una alerta que falla no debe tumbar la petición.
 */
export async function sendAlert(title: string, message: string): Promise<void> {
  console.warn(`[alert] ${title} — ${message}`);
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;
  try {
    const isNtfy = /(^|\.)ntfy\.sh\//.test(url) || url.includes("ntfy");
    await fetch(url, {
      method: "POST",
      headers: isNtfy
        ? { "content-type": "text/plain; charset=utf-8", Title: title.normalize("NFD").replace(/[̀-ͯ]/g, "") }
        : { "content-type": "application/json" },
      body: isNtfy ? message : JSON.stringify({ text: `${title}\n${message}`, content: `${title}\n${message}` }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn("[alert] no se pudo enviar:", err instanceof Error ? err.message : err);
  }
}
