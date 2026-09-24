import { z } from "zod";
import type { Tool } from "../types";

/** Sin HTML ni caracteres de control; el texto se guarda tal cual después de esto. */
function clean(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .split("")
    .filter((ch) => {
      const c = ch.charCodeAt(0);
      return c === 9 || c === 10 || c >= 32;
    })
    .join("")
    .trim();
}

const input = z.object({
  nombre: z.string().transform(clean).pipe(z.string().min(2).max(80)).describe("nombre del visitante"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.string().email().max(120))
    .describe("correo del visitante para responderle"),
  texto: z
    .string()
    .transform(clean)
    .pipe(z.string().min(10).max(1000))
    .describe("el mensaje, en palabras del visitante"),
});

const DAY_MS = 24 * 60 * 60 * 1000;
const DUPLICATE_WINDOW_MS = 60 * 60 * 1000;

/**
 * El único tool con efecto secundario en todo el sistema, y esa restricción
 * es deliberada. Rate limit por IP, sanitización, y el texto crudo no se
 * reenvía a ninguna bandeja: queda en la base y se revisa desde ahí.
 */
export const leaveMessage: Tool<z.infer<typeof input>> = {
  name: "dejar_mensaje",
  description:
    "Guarda un mensaje del visitante para que la persona lo lea y le responda. Antes de llamarla, pide y confirma en voz alta el nombre, el correo y el mensaje. Llámala una sola vez por mensaje.",
  input,
  sideEffect: true,
  async run({ nombre, email, texto }, ctx) {
    // El modelo a veces vuelve a llamar tras un "sí, guárdalo": el segundo
    // intento con el mismo contenido no duplica nada.
    if (await ctx.store.hasDuplicate(ctx.sessionId, email, texto, new Date(Date.now() - DUPLICATE_WINDOW_MS))) {
      return {
        ok: true,
        data: { guardado: true, nota: "Este mensaje ya estaba guardado; no hace falta repetirlo. Confírmaselo al visitante." },
      };
    }
    const since = new Date(Date.now() - DAY_MS);
    const count = await ctx.store.countSince(ctx.ipHash, since);
    if (count >= ctx.tenant.limits.messagesPerIpPerDay) {
      return {
        ok: false,
        error:
          "Este visitante ya dejó el máximo de mensajes por hoy. Sugiérele escribir directamente al correo de contacto.",
      };
    }
    await ctx.store.save({
      tenant: ctx.tenant.id,
      sessionId: ctx.sessionId,
      name: nombre,
      email,
      body: texto,
      ipHash: ctx.ipHash,
      origin: ctx.origin,
    });
    return {
      ok: true,
      data: {
        guardado: true,
        nota: `Mensaje de ${nombre} guardado. Confírmale que ${ctx.tenant.displayName} lo leerá y le responderá al correo ${email}.`,
      },
    };
  },
};
