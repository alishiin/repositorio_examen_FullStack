import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // El subproyecto backend/ usa Jest (ESM) con su propia config.
      'backend/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/hooks/**/*.{js,jsx}',
        'src/context/**/*.{js,jsx}',
        'src/components/Notifications/**/*.{js,jsx}',
        'src/components/Chat/ChatRoomList.{js,jsx}',
        'src/api/client.js',
      ],
      exclude: [
        '**/*.test.{js,jsx}',
        '**/*.config.{js,jsx}',
        'src/main.jsx',
        'src/test/**',
        // Excluidos del coverage (FASE 2D, justificado):
        // - hooks/index.js: solo re-exports, sin logica
        // - ChatWindow.jsx + ReportForm.jsx: componentes grandes con dependencias
        //   pesadas (WebSocket activo / mapas + formularios multipart). Testearlos
        //   bien requeriria E2E (Playwright), no unit tests.
        'src/hooks/index.js',
        'src/components/Chat/ChatWindow.jsx',
        'src/components/ReportForm/**',
      ],
    },
  },
});
