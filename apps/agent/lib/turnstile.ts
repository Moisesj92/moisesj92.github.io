/**
 * Cliente de Cloudflare Turnstile en modo invisible: carga el script una
 * vez, renderiza un widget oculto y obtiene un token por cada petición
 * (cada token es de un solo uso). Si no hay site key, devuelve null y el
 * servidor no lo exige.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface Turnstile {
  render(container: HTMLElement, opts: Record<string, unknown>): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
}

let scriptLoading: Promise<Turnstile> | null = null;
let widgetId: string | null = null;
let pending: { resolve: (t: string) => void; reject: (e: Error) => void } | null = null;

function loadScript(): Promise<Turnstile> {
  if (!scriptLoading) {
    scriptLoading = new Promise((resolve, reject) => {
      const w = window as unknown as { turnstile?: Turnstile };
      if (w.turnstile) return resolve(w.turnstile);
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error("Turnstile no cargó")));
      s.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
      document.head.appendChild(s);
    });
  }
  return scriptLoading;
}

export function turnstileConfigured(): boolean {
  return !!SITE_KEY;
}

export async function getTurnstileToken(): Promise<string | null> {
  if (!SITE_KEY) return null;
  const ts = await loadScript();
  if (!widgetId) {
    // Fuera de la vista pero no display:none: Turnstile no ejecuta el desafío
    // en contenedores ocultos (error 600010).
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:fixed;width:0;height:0;overflow:hidden;bottom:0;right:0;";
    document.body.appendChild(el);
    widgetId = ts.render(el, {
      sitekey: SITE_KEY,
      execution: "execute",
      appearance: "interaction-only",
      callback: (token: string) => {
        pending?.resolve(token);
        pending = null;
      },
      "error-callback": () => {
        pending?.reject(new Error("Turnstile falló"));
        pending = null;
      },
      "expired-callback": () => {
        pending?.reject(new Error("Turnstile expiró"));
        pending = null;
      },
    });
  }
  return new Promise<string>((resolve, reject) => {
    pending = { resolve, reject };
    ts.reset(widgetId!);
    ts.execute(widgetId!);
    setTimeout(() => {
      if (pending) {
        pending.reject(new Error("Turnstile no respondió"));
        pending = null;
      }
    }, 15000);
  });
}
