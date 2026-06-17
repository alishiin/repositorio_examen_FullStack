/**
 * Jest config con soporte ESM (el BFF es "type": "module").
 *
 * Para invocar: `NODE_OPTIONS=--experimental-vm-modules jest`
 * (el script npm ya pasa el flag).
 */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: [
    '<rootDir>/__tests__/**/*.test.js',
    '<rootDir>/routes/**/*.test.js',
  ],
  collectCoverageFrom: [
    'routes/**/*.js',
    '!routes/**/*.test.js',
    // Excluidos por scope (FASE 2D):
    // - admin.js: 550+ LOC con `fetch` global + `fs` real. Testear requiere
    //   un harness completo de mocks de filesystem y red. Cubrimos login
    //   y middleware (paths criticos de auth).
    // - server.js: bootstrap puro (listen + routes wiring); no testeable
    //   sin levantar el server real.
    '!routes/admin.js',
    '!server.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov'],
  // Limpia mocks entre tests.
  clearMocks: true,
  restoreMocks: true,
  // Evita el warning de tests vacios cuando jest descubre 0 tests en un archivo.
  passWithNoTests: false,
};
