/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep the Postgres driver out of the bundler so it loads normally at runtime
  // in server routes (and on Vercel Functions).
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
};

export default nextConfig;
