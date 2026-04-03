/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow building without env vars (they'll be set in Vercel/Supabase)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig;
