import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // markitdown (used for .docx) pulls in Node-only bits; let it run as a real
  // Node module instead of being bundled. PDFs are handled by unpdf, which is
  // built to bundle for serverless, so it is intentionally not listed here.
  serverExternalPackages: ["markitdown-ts", "mammoth", "jsdom"],
};

export default nextConfig;
