/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint is run explicitly via `pnpm lint`; don't fail the Netlify build on it.
    ignoreDuringBuilds: false,
  },
  // Les en-têtes de sécurité (dont la CSP) sont déclarés dans netlify.toml
  // (natif Netlify) — voir T3.1 — pour éviter la traduction du plugin.
};

export default nextConfig;
