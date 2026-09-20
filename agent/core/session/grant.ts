import { GoogleGenAI, Modality, type LiveConnectConfig } from "@google/genai";
import { buildSystemPrompt } from "../prompt/system";
import type { TenantRuntime } from "../runtime";

/** Lo que el navegador recibe para abrir la sesión de voz. Nunca contiene la API key. */
export interface SessionGrant {
  sessionId: string;
  token: string;
  model: string;
  /** ISO: cuándo Gemini deja de aceptar mensajes en esta sesión (tope duro, ADR-005) */
  expiresAt: string;
  /** ISO: hasta cuándo se puede abrir la sesión con este token (precalentado) */
  connectBy: string;
  /** saludo literal con el que el agente abre la conversación */
  greeting: string;
}

/** Margen para que el token no venza antes que el cierre de sesión que ve el usuario. */
const EXPIRY_MARGIN_S = 30;
/** Ventana para que el navegador abra la sesión después de recibir el token. */
const NEW_SESSION_WINDOW_S = 60;

/**
 * Configuración de la sesión Live. Va bloqueada dentro del token
 * (ADR-002): el cliente no puede cambiar prompt, tools, modalidad ni voz.
 */
export function buildLiveConfig(runtime: TenantRuntime): LiveConnectConfig {
  const { config, registry } = runtime;
  return {
    responseModalities: [Modality.AUDIO],
    systemInstruction: buildSystemPrompt(runtime),
    tools: [{ functionDeclarations: registry.declarations() }],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice.voiceName } },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };
}

/**
 * Pide a Gemini un token efímero de un solo uso con la configuración del
 * tenant bloqueada. `expireTime` implementa el tope duro de sesión sin
 * estado en el servidor (ADR-005).
 */
export async function createSessionGrant(
  runtime: TenantRuntime,
  apiKey: string,
): Promise<SessionGrant> {
  const { config } = runtime;
  const now = Date.now();
  const expireTime = new Date(
    now + (config.limits.sessionSeconds + EXPIRY_MARGIN_S) * 1000,
  );
  const newSessionExpireTime = new Date(now + NEW_SESSION_WINDOW_S * 1000);

  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: expireTime.toISOString(),
      newSessionExpireTime: newSessionExpireTime.toISOString(),
      liveConnectConstraints: {
        model: config.voice.model,
        config: buildLiveConfig(runtime),
      },
      // Sin lockAdditionalFields, la API bloquea TODO el config del token
      // (verificado: un cliente que manda otro systemInstruction y tools: []
      // es ignorado). No usar lockAdditionalFields: [] — el SDK 2.23 genera
      // una máscara con "tools.0" que la API rechaza como inválida.
    },
  });

  if (!token.name) {
    throw new Error("Gemini no devolvió un token efímero");
  }
  return {
    sessionId: crypto.randomUUID(),
    token: token.name,
    model: config.voice.model,
    expiresAt: expireTime.toISOString(),
    connectBy: newSessionExpireTime.toISOString(),
    greeting: config.voice.greeting,
  };
}
