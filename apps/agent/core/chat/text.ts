import { ApiError, GoogleGenAI, type Content, type Part } from "@google/genai";
import { buildSystemPrompt } from "../prompt/system";
import { toolContext, type TenantRuntime } from "../runtime";
import type { ToolResult } from "../types";

export interface ChatMessage {
  role: "user" | "agent";
  text: string;
}

export interface ToolStep {
  name: string;
  args: unknown;
  result: ToolResult;
  ms: number;
}

/** Una llamada al modelo dentro del turno, para el panel de eventos. */
export interface ModelCall {
  model: string;
  ms: number;
  /** "ok", o el status HTTP del fallo (429/503) que llevó al siguiente intento */
  result: string;
}

export interface ChatTurn {
  text: string;
  steps: ToolStep[];
  /** ids de los documentos que respaldaron la respuesta (atribución) */
  sources: string[];
  /** modelo que respondió: el principal o el de respaldo */
  model: string;
  /** dónde se fue el tiempo */
  timing: { modelCalls: ModelCall[]; toolsMs: number; totalMs: number };
}

/** Tope de rondas de tools por turno; evita loops si el modelo insiste. */
const MAX_ROUNDS = 4;
/** Pausa antes de la segunda vuelta de intentos cuando todos los modelos están saturados. */
const RETRY_PAUSE_MS = 2000;
/** Ninguna llamada al modelo puede tardar más que esto; en voz, más es una conversación muerta. */
const PER_CALL_TIMEOUT_MS = 15_000;

/** Cuota agotada o modelo saturado: el primer escalón de la cascada de degradación. */
export class ModelUnavailableError extends Error {
  constructor(public readonly status: number) {
    super("El modelo está saturado o sin cuota; inténtalo de nuevo en unos segundos");
    this.name = "ModelUnavailableError";
  }
}

function isUnavailable(err: unknown): err is ApiError {
  return err instanceof ApiError && (err.status === 429 || err.status === 503);
}

/**
 * Un turno de chat por texto con el mismo prompt, tools y retriever que la
 * voz. Es la ruta barata y determinista contra la que se desarrolla el
 * corpus (Fase 1) y corren las evals (Fase 3).
 */
export async function runTextTurn(
  runtime: TenantRuntime,
  apiKey: string,
  history: ChatMessage[],
  message: string,
  sessionId: string,
  ipHash: string,
  origin?: string,
): Promise<ChatTurn> {
  const { config, registry } = runtime;
  const ctx = toolContext(runtime, sessionId, ipHash, origin);
  // El SDK reintenta 429/503 por su cuenta con espera exponencial (hasta
  // minutos). Aquí se acota: un reintento corto y timeout por llamada; la
  // cascada de modelos de abajo decide antes de que el visitante se aburra.
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: PER_CALL_TIMEOUT_MS,
      retryOptions: { attempts: 2, initialDelay: 1, maxDelay: 2, jitter: 0.2 },
    },
  });

  const contents: Content[] = [
    ...history.map<Content>((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const steps: ToolStep[] = [];
  const sources = new Set<string>();
  const modelCalls: ModelCall[] = [];
  const turnStarted = performance.now();
  const generationConfig = {
    systemInstruction: buildSystemPrompt(runtime, "text"),
    tools: [{ functionDeclarations: registry.declarations() }],
    temperature: 0.2,
  };
  // Orden de intentos ante 429/503: principal, respaldo, pausa, principal,
  // respaldo. Las saturaciones de Gemini suelen durar segundos.
  const models = [config.text.model, config.text.fallbackModel].filter((m): m is string => !!m);
  const attempts = [...models, ...models];
  let attempt = 0;
  let model = attempts[0];

  for (let round = 0; round <= MAX_ROUNDS; round++) {
    let response;
    const callStarted = performance.now();
    try {
      response = await ai.models.generateContent({ model, contents, config: generationConfig });
      modelCalls.push({ model, ms: Math.round(performance.now() - callStarted), result: "ok" });
    } catch (err) {
      if (!isUnavailable(err)) throw err;
      modelCalls.push({ model, ms: Math.round(performance.now() - callStarted), result: String(err.status) });
      attempt++;
      if (attempt >= attempts.length) throw new ModelUnavailableError(err.status);
      if (attempt === models.length) await new Promise((r) => setTimeout(r, RETRY_PAUSE_MS));
      console.warn(`[chat] ${model} respondió ${err.status}; reintentando con ${attempts[attempt]}`);
      model = attempts[attempt];
      round--;
      continue;
    }

    const modelContent = response.candidates?.[0]?.content;
    const calls = (modelContent?.parts ?? []).filter((p) => p.functionCall);
    if (calls.length === 0 || round === MAX_ROUNDS) {
      return {
        text: response.text?.trim() ?? "",
        steps,
        sources: [...sources],
        model,
        timing: {
          modelCalls,
          toolsMs: steps.reduce((sum, s) => sum + s.ms, 0),
          totalMs: Math.round(performance.now() - turnStarted),
        },
      };
    }

    contents.push(modelContent!);
    const responseParts: Part[] = [];
    for (const part of calls) {
      const call = part.functionCall!;
      const name = call.name ?? "";
      const started = performance.now();
      const result = registry.has(name)
        ? await registry.run(name, call.args ?? {}, ctx)
        : { ok: false, error: `Tool desconocido: ${name}` };
      steps.push({ name, args: call.args ?? {}, result, ms: Math.round(performance.now() - started) });
      for (const s of result.sources ?? []) sources.add(s);
      responseParts.push({
        functionResponse: { id: call.id, name, response: result as unknown as Record<string, unknown> },
      });
    }
    contents.push({ role: "user", parts: responseParts });
  }
  // inalcanzable: el for retorna en la última ronda
  return { text: "", steps, sources: [...sources], model, timing: { modelCalls, toolsMs: 0, totalMs: 0 } };
}
