import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ["booksleafs-2.onrender.com"],
    proxy: {
      // "/api": "http://0.0.0.0:8000",
             "/api": "http://127.0.0.1:8000"
    },
  },
});
