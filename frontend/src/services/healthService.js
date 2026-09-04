import { apiRequest } from './api.js';

/**
 * Fetch health check status from backend
 * GET /api/health
 */
export async function getHealthStatus() {
  return await apiRequest('/health');
}
