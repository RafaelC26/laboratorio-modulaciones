import type { NextConfig } from "next";

const configuracionNext: NextConfig = {
  reactStrictMode: true,
  // El proyecto no incluye ESLint; la verificación de tipos se hace con `npm run typecheck`.
  eslint: { ignoreDuringBuilds: true },
};

export default configuracionNext;
