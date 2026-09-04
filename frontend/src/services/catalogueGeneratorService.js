import { apiRequest } from './api.js';

/**
 * Generate AI Multilingual Catalogue from Raw Combined Inputs
 * POST /api/ai/generate-catalogue
 * @param {object} payload - { imageAnalysis, description, attributes, outputLanguage }
 * @param {string} token 
 * @returns {Promise<{ success: boolean, catalogue: object, language: string, engine: string }>}
 */
export async function generateAiCatalogue(payload, token) {
  return await apiRequest('/ai/generate-catalogue', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      imageAnalysis: payload.imageAnalysis || {},
      description: payload.description || '',
      attributes: payload.attributes || {},
      outputLanguage: payload.outputLanguage || 'en',
    }),
  });
}

/**
 * Generate AI Multilingual Catalogue for a specific MongoDB product
 * POST /api/products/:id/generate-catalogue
 * @param {string} productId 
 * @param {object} payload - { imageAnalysis, description, attributes, outputLanguage, saveToProduct }
 * @param {string} token 
 */
export async function generateProductCatalogueById(productId, payload, token) {
  return await apiRequest(`/products/${productId}/generate-catalogue`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      imageAnalysis: payload.imageAnalysis || {},
      description: payload.description || '',
      attributes: payload.attributes || {},
      outputLanguage: payload.outputLanguage || 'en',
      saveToProduct: payload.saveToProduct === true,
    }),
  });
}

export default {
  generateAiCatalogue,
  generateProductCatalogueById,
};
