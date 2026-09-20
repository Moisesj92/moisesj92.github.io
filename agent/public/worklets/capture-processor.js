/**
 * Captura de micrófono → PCM 16-bit LE mono a 16 kHz.
 *
 * Corre en el hilo de audio. Recibe bloques de 128 frames a la tasa del
 * AudioContext (16 kHz si el navegador lo permitió; 44.1/48 kHz en Safari,
 * que ignora la opción), remuestrea si hace falta, convierte a Int16 y
 * postea chunks de `chunkSize` muestras (640 = 40 ms a 16 kHz).
 */
class CaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const opts = (options && options.processorOptions) || {};
    this.targetRate = opts.targetRate || 16000;
    this.chunkSize = opts.chunkSize || 640;
    this.ratio = sampleRate / this.targetRate; // sampleRate: global del worklet
    this.pos = 0; // posición fraccional en el flujo de entrada
    this.prev = 0; // última muestra del bloque anterior, para interpolar
    this.chunk = new Int16Array(this.chunkSize);
    this.filled = 0;
    this.sumSquares = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    if (this.ratio === 1) {
      for (let i = 0; i < channel.length; i++) this.pushSample(channel[i]);
    } else {
      // Interpolación lineal. Suficiente para voz; un filtro anti-alias
      // sería lo correcto para música, no para este caso.
      const n = channel.length;
      while (this.pos < n) {
        const i = Math.floor(this.pos);
        const frac = this.pos - i;
        const a = i === 0 ? this.prev : channel[i - 1];
        const b = channel[i];
        this.pushSample(a + (b - a) * frac);
        this.pos += this.ratio;
      }
      this.pos -= n;
      this.prev = channel[n - 1];
    }
    return true;
  }

  pushSample(s) {
    const c = s < -1 ? -1 : s > 1 ? 1 : s;
    this.chunk[this.filled++] = c < 0 ? c * 0x8000 : c * 0x7fff;
    this.sumSquares += c * c;
    if (this.filled === this.chunkSize) {
      const level = Math.sqrt(this.sumSquares / this.chunkSize);
      const out = this.chunk;
      this.port.postMessage({ pcm: out, level }, [out.buffer]);
      this.chunk = new Int16Array(this.chunkSize);
      this.filled = 0;
      this.sumSquares = 0;
    }
  }
}

registerProcessor("capture-processor", CaptureProcessor);
