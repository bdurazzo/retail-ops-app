// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src-new"),
      "@lib": path.resolve(__dirname, "lib"),
      "@data": path.resolve(__dirname, "data"),
    },
  },
});