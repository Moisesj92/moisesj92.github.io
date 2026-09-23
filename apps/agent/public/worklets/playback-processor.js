/**
 * Reproducción de PCM 16-bit LE mono a 24 kHz con cola y corte inmediato.
 *
 * `<audio>` no sirve aquí: al interrumpir hay que vaciar lo que aún no
 * sonó, y eso exige controlar el buffer. Mensajes:
 *   { type: "push", pcm: Int16Array }  encola audio
 *   { type: "flush" }                  descarta todo lo pendiente (barge-in)
 * Emite { type: "state", playing } cuando empieza o termina de sonar y
 * { type: "level", value } (RMS 0..1) cada ~50 ms mientras suena.
 */
class PlaybackProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.sourceRate = opts.sourceRate || 24000;
    this.ratio = this.sourceRate / sampleRate; // >1 si el contexto no aceptó 24 kHz
    this.queue = []; // Float32Array[] ya a la tasa del contexto
    this.head = 0; // offset dentro de queue[0]
    this.playing = false;
    this.levelAcc = 0;
    this.levelN = 0;
    this.port.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "push") this.enqueue(msg.pcm);
      else if (msg.type === "flush") {
        this.queue = [];
        this.head = 0;
        this.setPlaying(false);
      }
    };
  }

  enqueue(pcm) {
    const n = pcm.length;
    if (this.ratio === 1) {
      const f = new Float32Array(n);
      for (let i = 0; i < n; i++) f[i] = pcm[i] / 0x8000;
      this.queue.push(f);
      return;
    }
    const outLen = Math.floor(n / this.ratio);
    const f = new Float32Array(outLen);
    for (let j = 0; j < outLen; j++) {
      const p = j * this.ratio;
      const i = Math.floor(p);
      const a = pcm[i] / 0x8000;
      const b = (i + 1 < n ? pcm[i + 1] : pcm[i]) / 0x8000;
      f[j] = a + (b - a) * (p - i);
    }
    this.queue.push(f);
  }

  setPlaying(v) {
    if (this.playing !== v) {
      this.playing = v;
      this.port.postMessage({ type: "state", playing: v });
    }
  }

  process(_inputs, outputs) {
    const out = outputs[0] && outputs[0][0];
    if (!out) return true;
    let written = 0;
    while (written < out.length && this.queue.length > 0) {
      const cur = this.queue[0];
      const take = Math.min(out.length - written, cur.length - this.head);
      out.set(cur.subarray(this.head, this.head + take), written);
      written += take;
      this.head += take;
      if (this.head >= cur.length) {
        this.queue.shift();
        this.head = 0;
      }
    }
    if (written < out.length) out.fill(0, written);
    this.setPlaying(written > 0);
    if (written > 0) {
      for (let i = 0; i < written; i++) this.levelAcc += out[i] * out[i];
      this.levelN += written;
      if (this.levelN >= sampleRate / 20) {
        this.port.postMessage({ type: "level", value: Math.sqrt(this.levelAcc / this.levelN) });
        this.levelAcc = 0;
        this.levelN = 0;
      }
    }
    return true;
  }
}

registerProcessor("playback-processor", PlaybackProcessor);
