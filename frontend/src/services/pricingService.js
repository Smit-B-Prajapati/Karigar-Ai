import { apiRequest } from './api.js';

/**
 * Analyze Dynamic Pricing for a product using cost inputs, product attributes & market data
 * POST /api/pricing/analyze
 * @param {object} payload - { productId, materialCost, labourCost, packagingCost, otherCost, category, productType, material, craftType, description }
 * @param {string} token 
 */
export async function analyzeDynamicPricing(payload, token) {
  return await apiRequest('/pricing/analyze', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Calculate AI-assisted Smart Price Recommendation (legacy alias)
 * POST /api/pricing/calculate
 * @param {object} payload
 * @param {string} token 
 */
export async function calculateSmartPricing(payload, token) {
  return await analyzeDynamicPricing(payload, token);
}

/**
 * Calculate and optionally apply Smart Price Recommendation to a MongoDB Product
 * POST /api/products/:id/pricing
 * @param {string} productId 
 * @param {object} payload - { materialCost, labourCost, packagingCost, otherCost, applyToProduct, customPrice }
 * @param {string} token 
 */
export async function calculateProductPricingById(productId, payload, token) {
  return await apiRequest(`/products/${productId}/pricing`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export default {
  analyzeDynamicPricing,
  calculateSmartPricing,
  calculateProductPricingById,
};

