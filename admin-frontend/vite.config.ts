import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        // PRODUCTION: Live Render Backend
        target: 'https://sunrise-connect-backend.onrender.com',
        // LOCAL: Uncomment to use local backend server
        // target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    // port: 5173,
    // host: true,
  },
});
