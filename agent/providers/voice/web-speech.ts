import type { ToolResult } from "@/core/types";
import type { SessionGrant, VoiceEvent, VoiceProvider } from "./types";

/** Tipos mínimos de la Web Speech API (no están en lib.dom para todos los navegadores). */
interface RecognitionResultEvent extends Event {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface Recognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: Event & { error?: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function webSpeechAvailable(): boolean {
  return typeof window !== "undefined" && !!recognitionCtor() && "speechSynthesis" in window;
}

interface ChatResponse {
  sessionId: string;
  text: string;
  steps: { name: string; result: ToolResult }[];
  sources: string[];
}

/**
 * Último escalón de la cascada de degradación: reconocimiento y síntesis
 * de voz del propio navegador, con el cerebro en /api/chat (mismo prompt,
 * tools y retriever). Menor calidad que Gemini Live y sin interrupción a
 * mitad de frase, pero nunca un error. Escucha y habla por turnos: mientras
 * el agente habla no escucha, para no transcribirse a sí mismo.
 */
export class WebSpeechProvider implements VoiceProvider {
  readonly handlesAudio = true;
  private emit: (e: VoiceEvent) => void = () => {};
  private grant: SessionGrant | null = null;
  private recognition: Recognition | null = null;
  private history: { role: "user" | "agent"; text: string }[] = [];
  private active = false;
  private lang = "es-CL";
  private tenant?: string;

  constructor(opts?: { tenant?: string; lang?: string }) {
    this.tenant = opts?.tenant;
    if (opts?.lang) this.lang = opts.lang;
  }

  async connect(grant: SessionGrant, onEvent: (e: VoiceEvent) => void): Promise<void> {
    const Ctor = recognitionCtor();
    if (!Ctor || !("speechSynthesis" in window)) {
      throw new Error("Este navegador no tiene reconocimiento de voz.");
    }
    this.emit = onEvent;
    this.grant = grant;
    this.active = true;
    this.history = [];
    this.recognition = new Ctor();
    this.recognition.lang = this.lang;
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.emit({ type: "connected" });
    await this.speak(grant.greeting);
    this.history.push({ role: "agent", text: grant.greeting });
    this.emit({ type: "transcript", role: "agent", text: grant.greeting, final: true });
    this.emit({ type: "turnComplete" });
    this.listen();
  }

  sendAudio(): void {}
  sendToolResponse(): void {}

  disconnect(): void {
    if (!this.active) return;
    this.active = false;
    this.recognition?.abort();
    this.recognition = null;
    window.speechSynthesis.cancel();
    this.emit({ type: "closed", reason: "usuario" });
  }

  private listen(): void {
    const rec = this.recognition;
    if (!rec || !this.active) return;
    let finalText = "";
    let lastInterim = "";
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finalText += text;
        else if (text !== lastInterim) {
          lastInterim = text;
        }
      }
    };
    rec.onerror = (e) => {
      // "no-speech" y "aborted" son normales; el resto se informa y se sigue escuchando.
      if (e.error && e.error !== "no-speech" && e.error !== "aborted") {
        this.emit({ type: "error", message: `Reconocimiento de voz: ${e.error}`, recoverable: true });
      }
    };
    rec.onend = () => {
      if (!this.active) return;
      const text = finalText.trim();
      if (!text) {
        this.listen();
        return;
      }
      void this.answer(text);
    };
    try {
      rec.start();
    } catch {
      // start() lanza si ya estaba corriendo; se reintenta en el siguiente onend.
    }
  }

  private async answer(userText: string): Promise<void> {
    this.emit({ type: "transcript", role: "user", text: userText, final: true });
    const history = this.history.slice(-20);
    this.history.push({ role: "user", text: userText });
    let reply = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenant: this.tenant, sessionId: this.grant?.sessionId, history, message: userText }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<ChatResponse> & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      const turn = body as ChatResponse;
      for (const step of turn.steps) this.emit({ type: "toolResult", name: step.name, result: step.result });
      reply = turn.text;
    } catch (err) {
      reply = "Lo siento, no pude responder ahora mismo. ¿Puedes repetirlo?";
      this.emit({ type: "error", message: err instanceof Error ? err.message : String(err), recoverable: true });
    }
    if (!this.active) return;
    this.history.push({ role: "agent", text: reply });
    this.emit({ type: "transcript", role: "agent", text: reply, final: true });
    await this.speak(reply);
    this.emit({ type: "turnComplete" });
    this.listen();
  }

  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.active) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.lang;
      const voice = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(this.lang.slice(0, 2)));
      if (voice) u.voice = voice;
      u.onstart = () => this.emit({ type: "agentSpeaking", speaking: true });
      const done = () => {
        this.emit({ type: "agentSpeaking", speaking: false });
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }
}
