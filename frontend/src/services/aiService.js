import { apiRequest } from './api.js';
import { fileToBase64 } from './productService.js';

/**
 * Call backend Multimodal AI service to analyze craft image
 * POST /api/ai/analyze-image
 * @param {string|File|Blob} imageInput - Base64 Data URL or browser File
 * @param {string} token - JWT auth token
 * @param {object} [context] - Optional metadata (name, category)
 * @returns {Promise<{ success: boolean, analysis: object, engine: string }>}
 */
export async function analyzeImage(imageInput, token, context = {}) {
  let imagePayload = imageInput;

  if (imageInput instanceof File || imageInput instanceof Blob) {
    const converted = await fileToBase64(imageInput);
    imagePayload = converted.image;
  }

  return await apiRequest('/ai/analyze-image', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      image: imagePayload,
      name: context.name || '',
      category: context.category || '',
      productId: context.productId || '',
    }),
  });
}

/**
 * Call backend to analyze saved product image by product ID
 * POST /api/products/:id/analyze
 * @param {string} productId - Product ID
 * @param {string} token - JWT auth token
 */
export async function analyzeProductById(productId, token) {
  return await apiRequest(`/products/${productId}/analyze`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default {
  analyzeImage,
  analyzeProductById,
};
