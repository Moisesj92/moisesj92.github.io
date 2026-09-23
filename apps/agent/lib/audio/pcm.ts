/** Helpers para mover PCM 16-bit LE entre el navegador y la API (base64). */

export function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = "";
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

export function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  // Un chunk impar de bytes no es PCM16 válido; se descarta el byte sobrante.
  const even = bytes.length - (bytes.length % 2);
  return new Int16Array(bytes.buffer, 0, even / 2);
}
