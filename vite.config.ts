import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    // O Keycloak do professor (kiriland) não devolve o header
    // Access-Control-Allow-Origin na resposta POST do token endpoint (só no
    // preflight OPTIONS, via Apache), então o browser bloqueia o login com
    // "Failed to fetch"/CORS. Proxyando /keycloak pelo dev server o browser
    // fala same-origin com localhost:5173 e o Vite repassa server-side (sem
    // CORS). Use VITE_KEYCLOAK_URL=/keycloak no .env.
    proxy: {
      "/keycloak": {
        target: "https://kiriland.unb.br",
        changeOrigin: true,
      },
    },
  },
});
