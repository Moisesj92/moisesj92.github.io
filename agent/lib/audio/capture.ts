import { createAudioContext } from "./context";

export const CAPTURE_RATE = 16000;
/** 40 ms a 16 kHz: suficientemente pequeño para latencia, grande para no saturar el socket. */
const CHUNK_SAMPLES = 640;

export interface CaptureChunk {
  pcm: Int16Array;
  /** RMS 0..1 del chunk, para un medidor de nivel */
  level: number;
}

export class MicDeniedError extends Error {
  constructor() {
    super("Permiso de micrófono denegado");
    this.name = "MicDeniedError";
  }
}

/**
 * Captura del micrófono como PCM16 mono a 16 kHz.
 *
 * Crear la instancia dentro del gesto del usuario: iOS solo arranca un
 * AudioContext desde un click/tap. `echoCancellation` es obligatorio: sin
 * él el agente se escucha a sí mismo por los parlantes y se interrumpe solo.
 */
export class MicCapture {
  private constructor(
    private readonly ctx: AudioContext,
    private readonly stream: MediaStream,
    private readonly node: AudioWorkletNode,
  ) {}

  static async start(onChunk: (chunk: CaptureChunk) => void): Promise<MicCapture> {
    const ctx = createAudioContext(CAPTURE_RATE);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err) {
      await ctx.close();
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError")) {
        throw new MicDeniedError();
      }
      throw err;
    }

    await ctx.audioWorklet.addModule("/worklets/capture-processor.js");
    const node = new AudioWorkletNode(ctx, "capture-processor", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: 1,
      processorOptions: { targetRate: CAPTURE_RATE, chunkSize: CHUNK_SAMPLES },
    });
    node.port.onmessage = (e: MessageEvent<CaptureChunk>) => onChunk(e.data);

    ctx.createMediaStreamSource(stream).connect(node);
    // El worklet no escribe en su salida; conectar al destino garantiza que
    // el grafo procese (algunos navegadores no llaman a process() si no).
    node.connect(ctx.destination);
    return new MicCapture(ctx, stream, node);
  }

  get sampleRate(): number {
    return this.ctx.sampleRate;
  }

  async stop(): Promise<void> {
    this.node.port.onmessage = null;
    this.node.disconnect();
    for (const t of this.stream.getTracks()) t.stop();
    await this.ctx.close();
  }
}
