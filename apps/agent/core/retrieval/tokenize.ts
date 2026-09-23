/**
 * Tokenización mínima para BM25 sobre texto en español e inglés: minúsculas,
 * sin acentos, sin signos, sin stopwords, con un recorte de plurales.
 * Suficiente para ~30 documentos; un stemmer real sería otra dependencia
 * para una mejora que no se notaría.
 */

const STOPWORDS = new Set(
  (
    "a al algo ante como con contra cual cuando de del desde donde dos e el ella ellas ellos en entre era eres es esa ese eso esta estas este esto estos fue ha hace han hasta hay la las le les lo los mas me mi mis mucho muy nada ni no nos o os otra otro para pero poco por que quien se ser si sin sobre su sus te tiene tu tus un una uno unos unas y ya yo el ella usted ustedes nosotros vosotros " +
    "a an and are as at be by for from has have he her his how i in is it its of on or she that the their there these they this to was we were what when where which who why will with you your"
  ).split(/\s+/),
);

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function stem(token: string): string {
  // "node.js", "c#", "s3": nombres de tecnologías, no palabras; no se recortan.
  if (!/^[a-z]+$/.test(token)) return token;
  if (token.length > 5 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9+#.]+/)
    .map((t) => t.replace(/^[.]+|[.]+$/g, "")) // "node.js" se queda; "fin." pierde el punto
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}
