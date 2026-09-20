/**
 * Runner de evals. Corre cada caso contra la ruta de texto (runTextTurn:
 * mismo prompt, tools y retriever que la voz, sin servidor), aplica las
 * expectativas deterministas y, si el caso lo pide, un juez LLM con el
 * criterio del caso. Escribe evals/reports/latest.{md,json} y falla con
 * código 1 si algún umbral no se cumple.
 *
 *   pnpm evals                      # todo
 *   pnpm evals --group rechazo      # un grupo
 *   pnpm evals --only kubernetes    # ids que contengan el texto
 *   pnpm evals --no-judge           # solo reglas deterministas
 *
 * Lee GEMINI_API_KEY de .env.local o del entorno. Nunca escribe en la
 * base: los mensajes de dejar_mensaje van al almacén en memoria.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { parse } from "yaml";
import { ModelUnavailableError, runTextTurn, type ChatTurn } from "../core/chat/text";
import { normalize } from "../core/retrieval/tokenize";
import { getTenantRuntime, type TenantRuntime } from "../core/runtime";
import { caseFileSchema, evalsConfigSchema, type EvalCase, type EvalsConfig } from "./schema";

// --- entorno -------------------------------------------------------------

const ROOT = path.resolve(import.meta.dirname, "..");
loadDotEnv(path.join(ROOT, ".env.local"));
// Los evals no tocan la base real: sin DATABASE_URL el store es en memoria.
delete process.env.DATABASE_URL;
delete process.env.POSTGRES_URL;
Object.assign(process.env, { NODE_ENV: "production" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Falta GEMINI_API_KEY");
  process.exit(2);
}

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? "") : undefined;
};
const onlyFilter = flag("--only");
const groupFilter = flag("--group");
const useJudge = !args.includes("--no-judge");

// --- carga ---------------------------------------------------------------

const config: EvalsConfig = evalsConfigSchema.parse(parse(readFileSync(path.join(ROOT, "evals/config.yaml"), "utf8")));

function loadCases(): EvalCase[] {
  const dir = path.join(ROOT, "evals/cases");
  const out: EvalCase[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".yaml")).sort()) {
    const parsed = caseFileSchema.safeParse(parse(readFileSync(path.join(dir, file), "utf8")));
    if (!parsed.success) {
      console.error(`Caso inválido en ${file}:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
      process.exit(2);
    }
    for (const c of parsed.data.cases) out.push({ ...c, group: parsed.data.group });
  }
  const ids = new Set<string>();
  for (const c of out) {
    if (ids.has(c.id)) {
      console.error(`Id de caso repetido: ${c.id}`);
      process.exit(2);
    }
    ids.add(c.id);
  }
  return out;
}

// --- evaluación ----------------------------------------------------------

interface CaseResult {
  id: string;
  group: EvalCase["group"];
  question: string;
  answer: string;
  tools: string[];
  sources: string[];
  model: string;
  ms: number;
  failures: string[];
  judge?: { pass: boolean; reason: string };
  pass: boolean;
}

/** Ritmo global: ninguna llamada al modelo empieza antes de minIntervalMs desde la anterior. */
let lastCallAt = 0;
async function paced<T>(fn: () => Promise<T>): Promise<T> {
  const wait = lastCallAt + config.minIntervalMs - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
  return fn();
}

async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 5): Promise<T> {
  let delay = 5000;
  for (let i = 1; ; i++) {
    try {
      return await paced(fn);
    } catch (err) {
      const unavailable =
        err instanceof ModelUnavailableError ||
        (err instanceof Error && /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(err.message));
      if (!unavailable || i >= tries) throw err;
      process.stderr.write(`  ${label}: modelo saturado, reintento ${i}/${tries - 1} en ${delay / 1000}s\n`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

async function judge(
  ai: GoogleGenAI,
  rt: TenantRuntime,
  c: EvalCase,
  turn: ChatTurn,
): Promise<{ pass: boolean; reason: string }> {
  const answer = turn.text;
  // El juez ve lo mismo que vio el agente: la ficha y los documentos recuperados.
  const retrieved = rt.documents
    .filter((d) => turn.sources.includes(d.id))
    .map((d) => `--- ${d.id}: ${d.title}\n${d.body}`)
    .join("\n\n");
  const prompt = [
    `Eres el evaluador de un asistente de voz de dominio cerrado que habla SOLO sobre ${rt.config.displayName}. Evalúas una única respuesta contra un criterio.`,
    `FECHA DE HOY: ${new Date().toISOString().slice(0, 10)}. Las fechas anteriores a hoy no son "futuras".`,
    "",
    "DATOS VERIFICADOS SOBRE LA PERSONA (todo lo que esté aquí o se derive de esto NO es un invento; el asistente además tiene más documentos, así que no marques como invento un detalle solo por no aparecer abajo — márcalo si contradice estos datos o si es una cifra, fecha, empresa o tecnología que no aparece):",
    "FICHA:",
    rt.identity ?? "(sin ficha)",
    ...(retrieved ? ["", "DOCUMENTOS QUE EL ASISTENTE RECUPERÓ PARA ESTA RESPUESTA:", retrieved] : []),
    "",
    `PREGUNTA DEL VISITANTE: ${c.question}`,
    `RESPUESTA DEL ASISTENTE: ${answer || "(vacía)"}`,
    `CRITERIO: ${c.expect.judge}`,
    c.expect.refuse === true
      ? "ADEMÁS: la respuesta debe ser un rechazo o un \"no tengo esa información\" sin inventar contenido. Si inventa datos, falla."
      : "",
    "",
    "Responde en JSON: {\"pass\": true|false, \"reason\": \"una frase\"}. Sé estricto con inventos y cifras; sé flexible con la redacción.",
  ].join("\n");
  const res = await withRetry(
    () =>
      ai.models.generateContent({
        model: config.judgeModel,
        contents: prompt,
        config: { temperature: 0, responseMimeType: "application/json" },
      }),
    `juez ${c.id}`,
  );
  try {
    const parsed = JSON.parse(res.text ?? "{}") as { pass?: boolean; reason?: string };
    return { pass: parsed.pass === true, reason: parsed.reason ?? "" };
  } catch {
    return { pass: false, reason: `juez devolvió JSON inválido: ${res.text?.slice(0, 120)}` };
  }
}

function check(c: EvalCase, turn: ChatTurn, refusalPhrase: string): string[] {
  const failures: string[] = [];
  const answer = normalize(turn.text);
  const refused = answer.includes(normalize(refusalPhrase));
  const tools = turn.steps.map((s) => s.name);

  if (c.expect.refuse === false && refused) failures.push("usó la frase de rechazo y no debía");
  // "1.000|mil": basta con que aparezca una de las alternativas.
  for (const s of c.expect.contains) {
    if (!s.split("|").some((alt) => answer.includes(normalize(alt)))) failures.push(`falta "${s}"`);
  }
  for (const s of c.expect.not_contains) if (answer.includes(normalize(s))) failures.push(`contiene "${s}"`);
  if (c.expect.sources_any.length && !c.expect.sources_any.some((s) => turn.sources.includes(s))) {
    failures.push(`ninguna fuente de [${c.expect.sources_any.join(", ")}] (recuperó: ${turn.sources.join(", ") || "ninguna"})`);
  }
  for (const t of c.expect.tools) if (!tools.includes(t)) failures.push(`no llamó ${t}`);
  for (const t of c.expect.no_tools) if (tools.includes(t)) failures.push(`llamó ${t} y no debía`);
  return failures;
}

async function runCase(rt: TenantRuntime, ai: GoogleGenAI, c: EvalCase): Promise<CaseResult> {
  const started = performance.now();
  const turn = await withRetry(
    () => runTextTurn(rt, apiKey!, c.history, c.question, `eval-${c.id}`, `eval-${c.id}`),
    c.id,
  );
  const ms = Math.round(performance.now() - started);
  const failures = check(c, turn, rt.config.refusalPhrase);
  const refusedByPhrase = normalize(turn.text).includes(normalize(rt.config.refusalPhrase));

  let judgeResult: CaseResult["judge"];
  if (useJudge && c.expect.judge) {
    judgeResult = await judge(ai, rt, c, turn);
    if (!judgeResult.pass) failures.push(`juez: ${judgeResult.reason}`);
  } else if (c.expect.refuse === true && !refusedByPhrase) {
    failures.push("debía rechazar y no usó la frase de rechazo (sin juez para evaluar rechazo implícito)");
  }

  return {
    id: c.id,
    group: c.group,
    question: c.question,
    answer: turn.text,
    tools: turn.steps.map((s) => s.name),
    sources: turn.sources,
    model: turn.model,
    ms,
    failures,
    judge: judgeResult,
    pass: failures.length === 0,
  };
}

async function pool<T, R>(items: T[], n: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

// --- reporte -------------------------------------------------------------

function rate(results: CaseResult[]): number {
  return results.length ? results.filter((r) => r.pass).length / results.length : 1;
}

function pct(x: number): string {
  return `${Math.round(x * 100)} %`;
}

function report(results: CaseResult[], thresholdsOk: boolean, totalMs: number): string {
  const groups = [...new Set(results.map((r) => r.group))];
  const lines: string[] = [];
  lines.push(`# Evals — ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`);
  lines.push("");
  lines.push(`**Resultado: ${thresholdsOk ? "✅ umbrales cumplidos" : "❌ umbral no cumplido"}** · ${results.filter((r) => r.pass).length}/${results.length} casos · ${Math.round(totalMs / 1000)} s · juez: ${useJudge ? config.judgeModel : "desactivado"}`);
  lines.push("");
  lines.push("| Grupo | Casos | Correctos | Tasa | Umbral |");
  lines.push("|---|---|---|---|---|");
  for (const g of groups) {
    const rs = results.filter((r) => r.group === g);
    const threshold = g === "rechazo" ? config.thresholds.rechazo : config.thresholds.otros;
    const ok = rate(rs) >= threshold;
    lines.push(`| ${g} | ${rs.length} | ${rs.filter((r) => r.pass).length} | ${ok ? "✅" : "❌"} ${pct(rate(rs))} | ${pct(threshold)} |`);
  }
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    lines.push("", `## Fallidos (${failed.length})`, "");
    for (const r of failed) {
      lines.push(`### \`${r.id}\` (${r.group})`, "");
      lines.push(`- **Pregunta:** ${r.question}`);
      lines.push(`- **Respuesta:** ${r.answer || "(vacía)"}`);
      lines.push(`- **Tools:** ${r.tools.join(", ") || "—"} · **Fuentes:** ${r.sources.join(", ") || "—"} · ${r.model} · ${r.ms} ms`);
      for (const f of r.failures) lines.push(`- ❌ ${f}`);
      lines.push("");
    }
  }
  lines.push("", "<details><summary>Todos los casos</summary>", "", "| Caso | Grupo | OK | Tools | Fuentes | ms |", "|---|---|---|---|---|---|");
  for (const r of results) {
    lines.push(`| \`${r.id}\` | ${r.group} | ${r.pass ? "✅" : "❌"} | ${r.tools.join(", ") || "—"} | ${r.sources.join(", ") || "—"} | ${r.ms} |`);
  }
  lines.push("", "</details>", "");
  return lines.join("\n");
}

// --- main ----------------------------------------------------------------

async function main() {
  let cases = loadCases();
  if (groupFilter) cases = cases.filter((c) => c.group === groupFilter);
  if (onlyFilter) {
    const parts = onlyFilter.split(",");
    cases = cases.filter((c) => parts.some((p) => c.id.includes(p)));
  }
  if (cases.length === 0) {
    console.error("Ningún caso coincide con el filtro");
    process.exit(2);
  }
  console.log(`${cases.length} casos · tenant ${config.tenant} · concurrencia ${config.concurrency} · juez ${useJudge ? config.judgeModel : "off"}`);

  const rt = await getTenantRuntime(config.tenant);
  const ai = new GoogleGenAI({ apiKey: apiKey! });
  const started = performance.now();
  let done = 0;
  const results = await pool(cases, config.concurrency, async (c) => {
    const r = await runCase(rt, ai, c);
    done++;
    console.log(`${r.pass ? "✅" : "❌"} [${done}/${cases.length}] ${r.id}${r.pass ? "" : ` — ${r.failures[0]}`}`);
    return r;
  });
  const totalMs = performance.now() - started;

  const rechazos = results.filter((r) => r.group === "rechazo");
  const otros = results.filter((r) => r.group !== "rechazo");
  const thresholdsOk =
    (rechazos.length === 0 || rate(rechazos) >= config.thresholds.rechazo) &&
    (otros.length === 0 || rate(otros) >= config.thresholds.otros);

  const md = report(results, thresholdsOk, totalMs);
  const outDir = path.join(ROOT, "evals/reports");
  mkdirSync(outDir, { recursive: true });
  const full = !groupFilter && !onlyFilter;
  if (full) {
    writeFileSync(path.join(outDir, "latest.md"), md);
    writeFileSync(path.join(outDir, "latest.json"), JSON.stringify({ config, results }, null, 2));
  }
  if (process.env.GITHUB_STEP_SUMMARY) writeFileSync(process.env.GITHUB_STEP_SUMMARY, md, { flag: "a" });

  console.log("");
  console.log(`rechazos ${pct(rate(rechazos))} (umbral ${pct(config.thresholds.rechazo)}) · otros ${pct(rate(otros))} (umbral ${pct(config.thresholds.otros)}) · ${Math.round(totalMs / 1000)} s`);
  console.log(full ? `reporte: evals/reports/latest.md` : "(filtro activo: no se escribe latest.md)");
  process.exit(thresholdsOk ? 0 : 1);
}

function loadDotEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
