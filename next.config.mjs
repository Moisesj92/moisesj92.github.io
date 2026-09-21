/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sitio estático servido por GitHub Pages (moisesj92.github.io).
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
