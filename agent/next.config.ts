import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La raíz del repo tiene su propio proyecto Next (el portafolio) con su
  // lockfile; sin esto Next infiere ese directorio como raíz del workspace
  // y el tracing (y los includes de abajo) se resuelven contra la carpeta
  // equivocada, lo que rompe el deploy en Vercel.
  outputFileTracingRoot: __dirname,
  turbopack: { root: __dirname },
  // El corpus y agent.yaml se leen del disco en runtime; el trazado de
  // archivos no los detecta porque la ruta se arma dinámicamente.
  outputFileTracingIncludes: {
    "/api/**": ["./tenants/**/*", "./core/storage/schema.sql"],
  },
};

export default nextConfig;
