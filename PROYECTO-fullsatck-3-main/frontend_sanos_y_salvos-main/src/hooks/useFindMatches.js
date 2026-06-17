// src/hooks/useFindMatches.js
// Hook para buscar coincidencias de un reporte contra reportes opuestos.
import { useCallback, useState } from 'react';
import { matchServiceClient } from '../services/api';

export function useFindMatches() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [matches, setMatches] = useState([]);

  const findMatches = useCallback(async (reportData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await matchServiceClient.findMatches(reportData);
      const list = result?.matches || [];
      setMatches(list);
      return result;
    } catch (err) {
      setError(err.message || 'Error buscando coincidencias');
      setMatches([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setMatches([]);
    setError(null);
  }, []);

  return { loading, error, matches, findMatches, reset };
}

export default useFindMatches;
