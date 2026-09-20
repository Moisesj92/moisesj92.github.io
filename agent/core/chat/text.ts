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

export interface ChatTurn {
  text: string;
  steps: ToolStep[];
  /** ids de los documentos que respaldaron la respuesta (atribución) */
  sources: string[];
  /** modelo que respondió: el principal o el de respaldo */
  model: string;
}

/** Tope de rondas de tools por turno; evita loops si el modelo insiste. */
const MAX_ROUNDS = 4;

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
): Promise<ChatTurn> {
  const { config, registry } = runtime;
  const ctx = toolContext(runtime, sessionId, ipHash);
  const ai = new GoogleGenAI({ apiKey });

  const contents: Content[] = [
    ...history.map<Content>((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const steps: ToolStep[] = [];
  const sources = new Set<string>();
  const generationConfig = {
    systemInstruction: buildSystemPrompt(runtime, "text"),
    tools: [{ functionDeclarations: registry.declarations() }],
    temperature: 0.2,
  };
  let model = config.text.model;

  for (let round = 0; round <= MAX_ROUNDS; round++) {
    let response;
    try {
      response = await ai.models.generateContent({ model, contents, config: generationConfig });
    } catch (err) {
      if (!isUnavailable(err)) throw err;
      const fallback = config.text.fallbackModel;
      if (!fallback || model === fallback) throw new ModelUnavailableError(err.status);
      console.warn(`[chat] ${model} respondió ${err.status}; reintentando con ${fallback}`);
      model = fallback;
      round--;
      continue;
    }

    const modelContent = response.candidates?.[0]?.content;
    const calls = (modelContent?.parts ?? []).filter((p) => p.functionCall);
    if (calls.length === 0 || round === MAX_ROUNDS) {
      return { text: response.text?.trim() ?? "", steps, sources: [...sources], model };
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
  return { text: "", steps, sources: [...sources], model };
}
