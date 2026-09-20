/**
 * Conversa por texto con la sesión de voz real (Gemini Live) desde la
 * terminal, ejecutando los tools con el registry del tenant. Sirve para
 * reproducir comportamientos de la voz sin micrófono.
 *
 *   pnpm live-check "¿Me pasas el CV?" "Cuéntame de NeoWarehouse"
 *
 * Lee GEMINI_API_KEY de .env.local. Marca LEAK si el modelo narra JSON.
 */
import { readFileSync } from "node:fs";
import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { getTenantRuntime, toolContext } from "../core/runtime";
import { createSessionGrant } from "../core/session/grant";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim()];
    }),
);
const questions = process.argv.slice(2);
if (questions.length === 0) {
  console.error('Uso: pnpm live-check "pregunta 1" "pregunta 2" …');
  process.exit(1);
}
const rt = await getTenantRuntime("arsenio");
const grant = await createSessionGrant(rt, env.GEMINI_API_KEY);
const ctx = toolContext(rt, grant.sessionId, "live-check");
const client = new GoogleGenAI({ apiKey: grant.token, httpOptions: { apiVersion: "v1alpha" } });

let q = 0;
let greeted = false; let out = ""; const calls: string[] = []; let pendingTool = false; let uiEffects: string[] = [];
const results: { q: string; a: string; calls: string[]; ui: string[] }[] = [];
let finish: () => void; const wait = new Promise<void>((r) => (finish = r));

function ask() {
  if (q >= questions.length) { session.close(); finish(); return; }
  out = ""; calls.length = 0; uiEffects = [];
  session.sendClientContent({ turns: [{ role: "user", parts: [{ text: questions[q] }] }], turnComplete: true });
}
const session: Session = await client.live.connect({
  model: grant.model, config: {},
  callbacks: {
    onmessage: async (m: LiveServerMessage) => {
      const sc = m.serverContent;
      if (sc?.outputTranscription?.text) out += sc.outputTranscription.text;
      if (m.toolCall?.functionCalls) {
        pendingTool = true;
        for (const c of m.toolCall.functionCalls) {
          const r = await rt.registry.run(c.name!, c.args ?? {}, ctx);
          calls.push(`${c.name}(${JSON.stringify(c.args)}) → ${r.ok ? "ok" : r.error}`);
          if (r.ui) uiEffects.push(r.ui.kind);
          const forModel = { ...r };
          delete forModel.ui;
          session.sendToolResponse({ functionResponses: [{ id: c.id, name: c.name, response: forModel as Record<string, unknown> }] });
        }
        pendingTool = false;
      }
      if (sc?.turnComplete) {
        if (!greeted) {
          greeted = true;
          console.log("saludo:", out.trim());
          ask();
          return;
        }
        // Tras un tool call el modelo abre otro turno con la respuesta; esperar a tener texto.
        if (pendingTool || (calls.length > 0 && !out.trim())) return;
        results.push({ q: questions[q], a: out.trim(), calls: [...calls], ui: [...uiEffects] });
        q++; ask();
      }
    },
    onerror: (e) => { console.log("error", e.message); finish(); },
    onclose: () => finish(),
  },
});
// Saludo primero, como en la página; las preguntas empiezan cuando termina.
session.sendClientContent({ turns: [{ role: "user", parts: [{ text: "Saluda brevemente al visitante." }] }], turnComplete: true });
await Promise.race([wait, new Promise((r) => setTimeout(r, 120_000))]);
for (const r of results) {
  console.log("Q:", r.q); console.log("A:", r.a); console.log("   tools:", r.calls, "| ui:", r.ui);
  console.log("   LEAK:", /response|\{|\}/i.test(r.a) ? "SÍ ⚠️" : "no"); console.log();
}
process.exit(0);
