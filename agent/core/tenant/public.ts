import type { AgentConfig } from "../config/schema";
import { RETENTION_DAYS } from "../observability/turn-log";

/** Lo público de un tenant que la interfaz necesita: nada de prompt, corpus ni límites. */
export interface TenantPublic {
  id: string;
  displayName: string;
  languages: string[];
  greeting: string;
  intro: string;
  cardsLabel: string;
  brand: { primaryColor: string; avatarUrl: string | null };
  links: { cvPdf?: string; contactEmail?: string; website?: string };
  legal: { responsible?: string };
  retentionDays: number;
  /** ruta base de este tenant en la app: "" para el de por defecto, "/t/<id>" para el resto */
  basePath: string;
}

export function tenantPublic(config: AgentConfig, isDefault: boolean): TenantPublic {
  return {
    id: config.id,
    displayName: config.displayName,
    languages: config.languages,
    greeting: config.voice.greeting,
    intro: config.ui.intro,
    cardsLabel: config.ui.cardsLabel,
    brand: {
      primaryColor: config.brand.primaryColor,
      avatarUrl: config.brand.avatar ? `/api/tenant/avatar?tenant=${encodeURIComponent(config.id)}` : null,
    },
    links: config.links,
    legal: config.legal,
    retentionDays: RETENTION_DAYS,
    basePath: isDefault ? "" : `/t/${config.id}`,
  };
}
