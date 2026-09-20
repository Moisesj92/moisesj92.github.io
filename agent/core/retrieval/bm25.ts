import type { Document, Retriever } from "../types";
import { normalize, tokenize } from "./tokenize";

const K1 = 1.2;
const B = 0.75;
/** Título, tags, tecnologías y empresa pesan más que el cuerpo. */
const FIELD_BOOST = 3;

interface IndexedDoc {
  doc: Document;
  tf: Map<string, number>;
  length: number;
  /** tags + tecnologías + empresa normalizados, para el filtro previo */
  facets: Set<string>;
}

/**
 * Filtro por tags + BM25 sobre el Markdown plano (decisión del plan).
 *
 * 1. Si algún token de la consulta coincide con un tag, tecnología o
 *    empresa, solo se puntúan esos documentos. Si ninguno coincide, se
 *    puntúan todos.
 * 2. BM25 clásico con campos de cabecera repetidos FIELD_BOOST veces.
 *
 * Migrar a vectores después es cambiar esta clase, no su interfaz.
 */
export class BM25Retriever implements Retriever {
  private readonly docs: IndexedDoc[];
  private readonly df = new Map<string, number>();
  private readonly avgLength: number;

  constructor(documents: Document[]) {
    this.docs = documents.map((doc) => this.index(doc));
    for (const d of this.docs) {
      for (const term of d.tf.keys()) this.df.set(term, (this.df.get(term) ?? 0) + 1);
    }
    this.avgLength =
      this.docs.reduce((sum, d) => sum + d.length, 0) / Math.max(1, this.docs.length);
  }

  private index(doc: Document): IndexedDoc {
    const header = [doc.title, doc.company ?? "", doc.role ?? "", ...doc.tags, ...doc.technologies].join(" ");
    const tokens = [
      ...Array.from({ length: FIELD_BOOST }, () => tokenize(header)).flat(),
      ...tokenize(doc.body),
    ];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const facets = new Set<string>();
    for (const f of [...doc.tags, ...doc.technologies, doc.company ?? ""]) {
      for (const t of tokenize(f)) facets.add(t);
      if (f) facets.add(normalize(f));
    }
    return { doc, tf, length: tokens.length, facets };
  }

  async search(query: string, limit: number): Promise<Document[]> {
    const terms = tokenize(query);
    if (terms.length === 0 || this.docs.length === 0) return [];

    const filtered = this.docs.filter((d) => terms.some((t) => d.facets.has(t)));
    const candidates = filtered.length > 0 ? filtered : this.docs;
    const N = this.docs.length;

    const scored = candidates
      .map((d) => {
        let score = 0;
        for (const t of terms) {
          const f = d.tf.get(t);
          if (!f) continue;
          const n = this.df.get(t) ?? 0;
          const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
          score += idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * d.length) / this.avgLength)));
        }
        return { doc: d.doc, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.doc);
  }
}
