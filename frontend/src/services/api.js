// Base API Client wrapper using standard fetch API
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Custom API request helper
 * @param {string} endpoint 
 * @param {RequestInit} [options] 
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`[API Error] Request failed for ${endpoint}:`, error);
    throw error;
  }
}
