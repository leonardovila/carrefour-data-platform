import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Mirror de la convencion de los otros proyectos:
// la app se sirve desde /carrefour/ en produccion (nginx reverse proxy).
// En dev el proxy redirige las llamadas a la API local del VPS o local :8002.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const API_TARGET = env.VITE_API_TARGET || "http://127.0.0.1:8002";

  return {
    base: "/carrefour-data/",
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: {
        // Dev: /system, /products, /catalog, /cloud reenviadas a la API
        "^/(system|products|catalog|cloud|web)/?": {
          target: API_TARGET,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
