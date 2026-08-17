import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ server: { entry: "server" } }),
    react(),
    tailwindcss(),
  ],
  resolve: { tsconfigPaths: true },
  build: {
    // Avoid publishing local absolute source paths. Enable only in a controlled
    // CI environment with restricted source-map access.
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
});
