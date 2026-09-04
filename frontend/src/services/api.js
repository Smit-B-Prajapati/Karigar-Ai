// Base API Client wrapper using standard fetch API
// Automatically fallback to relative /api when accessed via mobile phone or local network
function getBaseApiUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isMobileOrLan = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isMobileOrLan && envUrl && envUrl.includes('localhost')) {
      return '/api';
    }
  }
  return envUrl || '/api';
}

const API_BASE_URL = getBaseApiUrl();

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

  const timeoutMs = options.timeout || 35000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const config = {
    ...options,
    signal: options.signal || controller.signal,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP Error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s. Please check network connection.`);
    }
    console.error(`[API Error] Request failed for ${endpoint}:`, error);
    throw error;
  }
}
