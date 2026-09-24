const KEY = "origen";
/* El mismo juego de caracteres que valida el servidor (core/observability/origin.ts). */
const VALID = /^[\w.-]{1,64}$/;

let cached: string | null | undefined;

/**
 * Origen de la visita: el utm_source con el que llegó a esta pestaña. Se lee
 * de la URL la primera vez y se guarda en sessionStorage, para que siga valiendo
 * si el visitante navega entre páginas del agente. Viaja en cada petición que
 * termina en la base (turnos y mensajes) para poder ver en /admin qué origen
 * habló con el agente.
 */
export function getOrigin(): string | undefined {
  if (cached !== undefined) return cached ?? undefined;
  if (typeof window === "undefined") return undefined;
  const fromUrl = new URLSearchParams(window.location.search).get("utm_source")?.toLowerCase();
  if (fromUrl && VALID.test(fromUrl)) {
    try {
      sessionStorage.setItem(KEY, fromUrl);
    } catch {
      // almacenamiento bloqueado: vale solo mientras dure la página
    }
    cached = fromUrl;
    return fromUrl;
  }
  try {
    cached = sessionStorage.getItem(KEY);
  } catch {
    cached = null;
  }
  return cached ?? undefined;
}
