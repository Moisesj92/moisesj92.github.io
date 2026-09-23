import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo: la raíz del workspace es dos niveles arriba.
  outputFileTracingRoot: path.join(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  transpilePackages: ['@repo/ui'],
  // Sitio estático servido por GitHub Pages (moisesj92.github.io).
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
