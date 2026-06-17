/**
 * Helper para tests del BFF con supertest + mocks ESM.
 * Cada test importa esto y obtiene una funcion `makeApp(router, mountPath)`.
 */
import express from 'express';

export const makeApp = (router, mountPath = '/') => {
  const app = express();
  app.use(express.json());
  app.use(mountPath, router);
  return app;
};
