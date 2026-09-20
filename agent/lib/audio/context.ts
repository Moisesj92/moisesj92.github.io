/**
 * Crea un AudioContext pidiendo una tasa concreta y lo reanuda de inmediato.
 * Debe llamarse dentro de un gesto del usuario (iOS). Safari ignora
 * `sampleRate`; los worklets remuestrean cuando `ctx.sampleRate` difiere.
 */
export function createAudioContext(sampleRate: number): AudioContext {
  let ctx: AudioContext;
  try {
    ctx = new AudioContext({ sampleRate });
  } catch {
    ctx = new AudioContext();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}
