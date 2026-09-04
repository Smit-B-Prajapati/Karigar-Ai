import { apiRequest } from './api.js';

/**
 * Call backend AI Business Advisor service with query & product context
 * POST /api/ai/advisor
 * @param {object} payload - { question, productContext, productId, conversationHistory }
 * @param {string} token - JWT auth token
 */
export async function getBusinessAdvice(payload, token) {
  return await apiRequest('/ai/advisor', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Call backend AI Business Advisor for a specific saved product ID
 * POST /api/products/:id/advisor
 * @param {string} productId - Product ID
 * @param {object} payload - { question, conversationHistory }
 * @param {string} token - JWT auth token
 */
export async function getProductBusinessAdvice(productId, payload, token) {
  return await apiRequest(`/products/${productId}/advisor`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export default {
  getBusinessAdvice,
  getProductBusinessAdvice,
};
