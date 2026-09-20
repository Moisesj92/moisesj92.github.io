import type { Document, Retriever } from "../types";

/**
 * Retriever vacío para Fase 0 (ADR-006): permite probar el relay de tools
 * y el comportamiento de dominio cerrado antes de que exista corpus.
 * Fase 1 lo reemplaza por BM25Retriever detrás de la misma interfaz.
 */
export class NullRetriever implements Retriever {
  async search(): Promise<Document[]> {
    return [];
  }
}
