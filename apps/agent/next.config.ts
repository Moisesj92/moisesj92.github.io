import path from "node:path";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/ui'],
  // Monorepo pnpm: las dependencias viven en el node_modules de la raíz del
  // workspace, así que Turbopack y el tracing tienen que mirar desde ahí.
  // Los includes de abajo siguen siendo relativos a esta carpeta.
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: { root: path.join(__dirname, "../..") },
  // El corpus y agent.yaml se leen del disco en runtime; el trazado de
  // archivos no los detecta porque la ruta se arma dinámicamente.
  outputFileTracingIncludes: {
    "/api/**": ["./tenants/**/*", "./core/storage/schema.sql"],
    "/arquitectura": ["./evals/reports/*"],
    "/admin": ["./core/storage/schema.sql"],
    "/privacidad": ["./tenants/**/*"],
    "/t/**": ["./tenants/**/*"],
    "/": ["./tenants/**/*"],
    "/opengraph-image": ["./tenants/**/*", "./images/*"],
  },
};

export default nextConfig;
