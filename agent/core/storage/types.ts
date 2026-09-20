/** Un mensaje dejado por un visitante a través de `dejar_mensaje`. */
export interface VisitorMessage {
  id: string;
  tenant: string;
  sessionId: string;
  name: string;
  email: string;
  body: string;
  /** hash del IP, nunca el IP en claro */
  ipHash: string;
  createdAt: Date;
}

/**
 * Persistencia del único tool con efecto secundario. La interfaz es
 * mínima a propósito: guardar y contar por IP para el rate limit.
 */
export interface MessageStore {
  save(message: Omit<VisitorMessage, "id" | "createdAt">): Promise<VisitorMessage>;
  countSince(ipHash: string, since: Date): Promise<number>;
  /** ¿la misma sesión ya dejó este mismo mensaje? (idempotencia ante reintentos del modelo) */
  hasDuplicate(sessionId: string, email: string, body: string, since: Date): Promise<boolean>;
}
