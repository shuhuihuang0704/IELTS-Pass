import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "backup",
  base: "/IELTS-Pass/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../backup-dist",
    emptyOutDir: true,
  },
});
