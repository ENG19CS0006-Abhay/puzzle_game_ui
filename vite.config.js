import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.VITE_PORT || 5173,
    open: true,
  },
  root: './',
  optimizeDeps: {
    include: ['lucide-react'],
  },
});
