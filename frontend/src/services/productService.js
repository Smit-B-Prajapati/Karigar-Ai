import { apiRequest } from './api.js';

/**
 * Get all products for authenticated artisan
 * GET /api/products
 */
export async function getProducts(token) {
  return await apiRequest('/products', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Get single product by ID
 * GET /api/products/:id
 */
export async function getProductById(id, token) {
  return await apiRequest(`/products/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Create new product listing
 * POST /api/products
 */
export async function createProduct(productData, token) {
  return await apiRequest('/products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
}

/**
 * Update product by ID
 * PUT /api/products/:id
 */
export async function updateProduct(id, productData, token) {
  return await apiRequest(`/products/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
}

/**
 * Helper to convert browser File/Blob to Base64 Data URL
 * @param {File|Blob} file 
 * @returns {Promise<{ image: string, filename: string, size: number, type: string }>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        image: reader.result,
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Delete product by ID
 * DELETE /api/products/:id
 */
export async function deleteProduct(id, token) {
  return await apiRequest(`/products/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Upload craft product image
 * POST /api/products/:id/image
 * @param {string} id - Product ID
 * @param {string|File|Object} imageInput - Base64 Data URL or File object or payload object
 * @param {string} token - JWT auth token
 */
export async function uploadProductImage(id, imageInput, token) {
  let payload;
  if (typeof imageInput === 'string') {
    payload = { image: imageInput };
  } else if (imageInput instanceof File || imageInput instanceof Blob) {
    payload = await fileToBase64(imageInput);
  } else {
    payload = imageInput;
  }

  return await apiRequest(`/products/${id}/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

