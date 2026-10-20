import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    //allowedHosts: ["booksleafs-2.onrender.com", "booleaf-8.onrender.com"],
    proxy: {
      // "/api": "http://0.0.0.0:8000",
             "/api": "http://127.0.0.1:8000"
    },
  },
  preview: {
   host: "0.0.0.0",
    port: Number(process.env.PORT) || 4173,
    strictPort: true,
    allowedHosts: ["booksleafs-2.onrender.com", "booleaf-8.onrender.com","booksleafs-4.onrender.com", "leaf-books.onrender.com" ],
  },
});
