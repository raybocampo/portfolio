import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These pull in native/Node-only bits (PDF and Word parsing); let them run
  // as real Node modules on the server instead of being bundled.
  serverExternalPackages: ["markitdown-ts", "pdf-parse", "mammoth", "jsdom"],
};

export default nextConfig;
