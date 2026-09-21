-- Mensajes dejados por visitantes (tool dejar_mensaje). Se aplica con `pnpm db:migrate`.
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant      text NOT NULL,
  session_id  text NOT NULL,
  name        text NOT NULL,
  email       text NOT NULL,
  body        text NOT NULL,
  ip_hash     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_ip_hash_created_at ON messages (ip_hash, created_at);
CREATE INDEX IF NOT EXISTS messages_tenant_created_at ON messages (tenant, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_session_id ON messages (session_id);

-- Contadores de uso para rate limit por IP y presupuesto diario por tenant.
-- Una fila por evento; se agrega por día. No guarda contenido.
CREATE TABLE IF NOT EXISTS usage_events (
  id          bigserial PRIMARY KEY,
  tenant      text NOT NULL,
  kind        text NOT NULL,          -- 'voice_session' | 'text_turn'
  ip_hash     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_tenant_kind_created_at ON usage_events (tenant, kind, created_at);
CREATE INDEX IF NOT EXISTS usage_events_ip_hash_kind_created_at ON usage_events (ip_hash, kind, created_at);
