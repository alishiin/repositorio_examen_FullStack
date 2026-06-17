// src/hooks/useGeoService.js
import { useState, useCallback } from 'react';
import { geoServiceClient } from '../services/api';

export function useGeoService() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const searchNearby = useCallback(async (latitude, longitude, radiusKm = 10, reportType = 'ambos') => {
    setLoading(true);
    setError(null);
    try {
      const result = await geoServiceClient.getNearbySpontaneous(latitude, longitude, radiusKm, reportType);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocations = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await geoServiceClient.getLocations(filters);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createLocation = useCallback(async (locationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await geoServiceClient.createLocation(locationData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, data, searchNearby, getLocations, createLocation };
}
