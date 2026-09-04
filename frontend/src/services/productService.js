import { apiRequest } from './api.js';
import { demoFallbackProducts } from './dummyData.js';

function getLocalProducts() {
  try {
    const raw = localStorage.getItem('karigar_local_products');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProducts(products) {
  try {
    localStorage.setItem('karigar_local_products', JSON.stringify(products));
  } catch (e) {}
}

/**
 * Get all products for authenticated artisan
 * GET /api/products
 */
export async function getProducts(token) {
  try {
    const res = await apiRequest('/products', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res && res.products) {
      return res;
    }
  } catch (err) {
    console.warn('Backend getProducts unavailable, using local mock catalogue:', err.message);
  }
  const locals = getLocalProducts();
  return {
    success: true,
    products: [...locals, ...demoFallbackProducts],
  };
}

/**
 * Get single product by ID
 * GET /api/products/:id
 */
export async function getProductById(id, token) {
  try {
    const res = await apiRequest(`/products/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res && (res.product || res.data)) return res;
  } catch (err) {
    console.warn('Backend getProductById unavailable, searching local products:', err.message);
  }
  const all = [...getLocalProducts(), ...demoFallbackProducts];
  const found = all.find(p => p._id === id || p.id === id);
  return {
    success: Boolean(found),
    product: found || demoFallbackProducts[0]
  };
}

/**
 * Create new product listing
 * POST /api/products
 */
export async function createProduct(productData, token) {
  try {
    const res = await apiRequest('/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    if (res && res.product) return res;
  } catch (err) {
    console.warn('Backend createProduct unavailable, storing product locally:', err.message);
  }
  const newProduct = {
    ...productData,
    _id: 'local_prod_' + Date.now(),
    id: 'local_prod_' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'Market-Ready'
  };
  const locals = getLocalProducts();
  saveLocalProducts([newProduct, ...locals]);
  return {
    success: true,
    product: newProduct
  };
}

/**
 * Update product by ID
 * PUT /api/products/:id
 */
export async function updateProduct(id, productData, token) {
  try {
    const res = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
      body: JSON.stringify(productData),
    });
    if (res && res.product) return res;
  } catch (err) {
    console.warn('Backend updateProduct unavailable, updating locally:', err.message);
  }

  const locals = getLocalProducts();
  const index = locals.findIndex(p => p._id === id || p.id === id);
  if (index !== -1) {
    locals[index] = { ...locals[index], ...productData, updatedAt: new Date().toISOString() };
    saveLocalProducts(locals);
    return {
      success: true,
      product: locals[index]
    };
  }

  return {
    success: true,
    product: { _id: id, id, ...productData }
  };
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
  try {
    const res = await apiRequest(`/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
    });
    if (res && res.success) return res;
  } catch (err) {
    console.warn('Backend deleteProduct unavailable, deleting locally:', err.message);
  }

  const locals = getLocalProducts();
  const filtered = locals.filter(p => p._id !== id && p.id !== id);
  saveLocalProducts(filtered);
  return {
    success: true,
    message: 'Product removed'
  };
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

  try {
    const res = await apiRequest(`/products/${id}/image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
      body: JSON.stringify(payload),
    });
    if (res && res.imageUrl) return res;
  } catch (err) {
    console.warn('Backend uploadProductImage unavailable, saving locally:', err.message);
  }

  const imageUrl = payload.image || (payload.images && payload.images[0]) || '';
  const locals = getLocalProducts();
  const idx = locals.findIndex(p => p._id === id || p.id === id);
  if (idx !== -1) {
    locals[idx].primaryImage = imageUrl;
    locals[idx].images = [imageUrl];
    saveLocalProducts(locals);
  }

  return {
    success: true,
    imageUrl,
    message: 'Image updated successfully'
  };
}


