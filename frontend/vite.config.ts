import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

// Plain Vite SPA build — outputs to dist/
// This replaces @lovable.dev/vite-tanstack-config (SSR/Nitro) so that
// the Go server can serve static files directly.
export default defineConfig({
  plugins: [tailwindcss(), react(), tsconfigPaths()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
