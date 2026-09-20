import { createAudioContext } from "./context";

export const PLAYBACK_RATE = 24000;

/**
 * Cola de reproducción para el PCM16 a 24 kHz que devuelve el modelo.
 * `flush()` descarta lo pendiente al instante: es lo que hace que la
 * interrupción se sienta inmediata.
 */
export class PcmPlayer {
  private constructor(
    private readonly ctx: AudioContext,
    private readonly node: AudioWorkletNode,
  ) {}

  static async start(onPlayingChange: (playing: boolean) => void): Promise<PcmPlayer> {
    const ctx = createAudioContext(PLAYBACK_RATE);
    await ctx.audioWorklet.addModule("/worklets/playback-processor.js");
    const node = new AudioWorkletNode(ctx, "playback-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { sourceRate: PLAYBACK_RATE },
    });
    node.port.onmessage = (e: MessageEvent<{ type: string; playing: boolean }>) => {
      if (e.data.type === "state") onPlayingChange(e.data.playing);
    };
    node.connect(ctx.destination);
    return new PcmPlayer(ctx, node);
  }

  push(pcm: Int16Array): void {
    this.node.port.postMessage({ type: "push", pcm }, [pcm.buffer]);
  }

  flush(): void {
    this.node.port.postMessage({ type: "flush" });
  }

  async close(): Promise<void> {
    this.node.port.onmessage = null;
    this.node.disconnect();
    await this.ctx.close();
  }
}
