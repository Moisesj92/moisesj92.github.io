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
