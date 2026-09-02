import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["@radix-ui/react-radio-group"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Binds to 0.0.0.0 inside container
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Required for Windows Docker volume mounts
      ignored: ['**/node_modules/**', '**/.git/**', '**/playwright-report/**', '**/test-results/**'],
    },
    hmr: {
      clientPort: 5174, // Matches host port 5174 mapped in docker-compose
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://backend:5000",
        changeOrigin: true,
      },
    },
    historyApiFallback: true,
  },
});
