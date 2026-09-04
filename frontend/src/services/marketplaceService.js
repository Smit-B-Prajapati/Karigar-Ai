import { apiRequest } from './api.js';

/**
 * Get marketplace preview data for a specific product
 * GET /api/products/:id/marketplace-preview
 * @param {string} productId 
 * @param {string} token 
 */
export async function getMarketplacePreview(productId, token) {
  return await apiRequest(`/products/${productId}/marketplace-preview`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Export entire artisan product catalogue in JSON format
 * GET /api/marketplace/export?format=json
 * @param {string} token 
 */
export async function exportCatalogueJson(token) {
  return await apiRequest('/marketplace/export?format=json', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Trigger file download directly in browser
 * @param {string|object} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadFile(content, filename, mimeType = 'application/json') {
  const data = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCatalogueCSV(products = []) {
  if (!products.length) return;
  const headers = ['ID', 'Name', 'Category', 'CraftType', 'Material', 'Price', 'Status'];
  const rows = products.map(p => [
    p._id || p.id || '',
    `"${(p.name || p.title || '').replace(/"/g, '""')}"`,
    `"${(p.category || '').replace(/"/g, '""')}"`,
    `"${(p.craftType || '').replace(/"/g, '""')}"`,
    `"${(p.material || '').replace(/"/g, '""')}"`,
    p.price || 0,
    p.status || 'Draft'
  ]);
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csvContent, `karigar_catalogue_${Date.now()}.csv`, 'text/csv');
}

export function exportCatalogueJSON(products = []) {
  downloadFile(products, `karigar_catalogue_${Date.now()}.json`, 'application/json');
}

export default {
  getMarketplacePreview,
  exportCatalogueJson,
  downloadFile,
  exportCatalogueCSV,
  exportCatalogueJSON
};
