/**
 * Eventos de Umami desde el código, para lo que no es un clic en un elemento
 * (los clics se marcan con `data-umami-event` directamente en el JSX).
 *
 * Nunca se envía el texto de lo que dice o escribe el visitante: eso queda en
 * la base propia, redactado y con retención de 30 días.
 */
type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

export function track(event: string, data?: EventData): void {
  // Sin script (bloqueador, desarrollo, localhost excluido): no hace nada.
  try {
    window.umami?.track(event, data);
  } catch {
    // la analítica nunca debe romper la conversación
  }
}

/** Eventos que se derivan del resultado de un tool, en voz y en texto. */
export function trackToolResult(name: string, ok: boolean): void {
  if (name === "dejar_mensaje" && ok) track("mensaje-dejado");
}
