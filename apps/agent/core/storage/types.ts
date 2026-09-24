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
  /** utm_source con el que llegó la visita, si venía marcada */
  origin?: string;
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
  listRecent(tenant: string, limit: number): Promise<VisitorMessage[]>;
}

export type UsageKind = "voice_session" | "text_turn";

/**
 * Contadores de uso: rate limit por IP y presupuesto diario por tenant.
 * Sin contenido; una fila por evento.
 */
export interface UsageStore {
  record(tenant: string, kind: UsageKind, ipHash: string): Promise<void>;
  countByIp(ipHash: string, kind: UsageKind, since: Date): Promise<number>;
  countByTenant(tenant: string, kind: UsageKind, since: Date): Promise<number>;
}

/** Un turno persistido. `userText`/`agentText` llegan ya redactados. */
export interface TurnRecord {
  tenant: string;
  sessionId: string;
  channel: "text" | "voice";
  userText: string;
  agentText: string;
  tools: { name: string; ok: boolean; ms?: number }[];
  sources: string[];
  model?: string;
  ms?: number;
  ttfaMs?: number;
  refused: boolean;
  /** utm_source con el que llegó la visita, si venía marcada */
  origin?: string;
}

export interface StoredTurn extends TurnRecord {
  id: number;
  createdAt: Date;
}

export interface TurnStats {
  sessions: number;
  turns: number;
  refusalRate: number;
  /** segundos, mediana de la duración de sesión (primer a último turno) */
  medianSessionSeconds: number;
  ttfaP50Ms: number | null;
  ttfaP95Ms: number | null;
  byChannel: { channel: string; turns: number }[];
  byModel: { model: string; turns: number }[];
  topQuestions: { question: string; count: number }[];
  /** sesiones distintas por origen de la visita, de más a menos */
  byOrigin: { origin: string; sessions: number }[];
}

export interface TurnStore {
  save(turn: TurnRecord): Promise<void>;
  listRecent(tenant: string, limit: number): Promise<StoredTurn[]>;
  stats(tenant: string, since: Date): Promise<TurnStats>;
  /** borra turnos anteriores a `before`; devuelve cuántos */
  purge(before: Date): Promise<number>;
}

/** Ajustes operativos de aplicación inmediata. */
export interface SettingsStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}
