import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El corpus y agent.yaml se leen del disco en runtime; el trazado de
  // archivos no los detecta porque la ruta se arma dinámicamente.
  outputFileTracingIncludes: {
    "/api/**": ["./tenants/**/*", "./core/storage/schema.sql"],
  },
};

export default nextConfig;
