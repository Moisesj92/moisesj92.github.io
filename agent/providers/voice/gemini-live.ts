import { GoogleGenAI, type LiveServerMessage, type Session } from "@google/genai";
import { base64ToInt16, int16ToBase64 } from "@/lib/audio/pcm";
import type { SessionGrant, VoiceEvent, VoiceProvider } from "./types";

const INPUT_MIME = "audio/pcm;rate=16000";

/**
 * Gemini Live API vía token efímero (ADR-002). La configuración de la
 * sesión (prompt, tools, voz) viene bloqueada en el token; aquí no se
 * envía nada de eso.
 */
export class GeminiLiveProvider implements VoiceProvider {
  private session: Session | null = null;
  private emit: (e: VoiceEvent) => void = () => {};
  private closedByUs = false;

  async connect(grant: SessionGrant, onEvent: (e: VoiceEvent) => void): Promise<void> {
    this.emit = onEvent;
    this.closedByUs = false;
    const ai = new GoogleGenAI({
      apiKey: grant.token,
      httpOptions: { apiVersion: "v1alpha" },
    });

    this.session = await ai.live.connect({
      model: grant.model,
      // Config vacía a propósito: todo viene bloqueado en el token.
      config: {},
      callbacks: {
        onopen: () => this.emit({ type: "connected" }),
        onmessage: (m) => this.handleMessage(m),
        onerror: (e) =>
          this.emit({ type: "error", message: e.message || "Error de conexión", recoverable: false }),
        onclose: (e) => {
          if (!this.closedByUs) {
            this.emit({ type: "closed", reason: e.reason || `code ${e.code}` });
          }
        },
      },
    });

    // Saludo inmediato: el primer audio llega antes de que el usuario hable.
    this.session.sendClientContent({
      turns: [{ role: "user", parts: [{ text: "Saluda brevemente al visitante." }] }],
      turnComplete: true,
    });
  }

  sendAudio(pcm16k: Int16Array): void {
    this.session?.sendRealtimeInput({
      audio: { data: int16ToBase64(pcm16k), mimeType: INPUT_MIME },
    });
  }

  sendToolResponse(id: string, name: string, response: unknown): void {
    this.session?.sendToolResponse({
      functionResponses: [{ id, name, response: response as Record<string, unknown> }],
    });
  }

  disconnect(): void {
    if (!this.session) return;
    this.closedByUs = true;
    this.session.close();
    this.session = null;
    this.emit({ type: "closed", reason: "usuario" });
  }

  private handleMessage(m: LiveServerMessage): void {
    const sc = m.serverContent;
    if (sc) {
      if (sc.interrupted) this.emit({ type: "interrupted" });
      for (const part of sc.modelTurn?.parts ?? []) {
        const data = part.inlineData?.data;
        if (data) this.emit({ type: "audio", pcm: base64ToInt16(data) });
      }
      if (sc.inputTranscription?.text) {
        this.emit({
          type: "transcript",
          role: "user",
          text: sc.inputTranscription.text,
          final: sc.inputTranscription.finished ?? false,
        });
      }
      if (sc.outputTranscription?.text) {
        this.emit({
          type: "transcript",
          role: "agent",
          text: sc.outputTranscription.text,
          final: sc.outputTranscription.finished ?? false,
        });
      }
      if (sc.turnComplete) this.emit({ type: "turnComplete" });
    }
    if (m.toolCall?.functionCalls?.length) {
      this.emit({
        type: "toolCall",
        calls: m.toolCall.functionCalls
          .filter((c) => c.id && c.name)
          .map((c) => ({ id: c.id!, name: c.name!, args: c.args ?? {} })),
      });
    }
    if (m.goAway) {
      this.emit({
        type: "error",
        message: `La sesión va a cerrarse (${m.goAway.timeLeft ?? "pronto"})`,
        recoverable: true,
      });
    }
  }
}
