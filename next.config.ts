import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every screen reads live, per-user data, so plain dynamic rendering is simpler than cache components.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
