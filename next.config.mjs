/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    allowedDevOrigins: ["localhost:3000", "localhost:3001", "192.168.56.1:3000", "192.168.56.1:3001"],
  },
}

export default nextConfig
