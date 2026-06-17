// src/hooks/index.js
// Custom hooks para los nuevos microservicios

export { useChat as useChat } from './useChat';
export { useMatchAnalysis as useMatchAnalysis } from './useMatchAnalysis';
export { useMediaUpload as useMediaUpload } from './useMediaUpload';
export { useNotifications as useNotifications } from './useNotifications';
export { useFindMatches } from './useFindMatches';

// Exportar todos juntos
export * from './useChat';
export * from './useMatchAnalysis';
export * from './useMediaUpload';
export * from './useNotifications';
export * from './useFindMatches';
