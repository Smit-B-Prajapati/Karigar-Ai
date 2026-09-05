import { apiRequest } from './api.js';

// Helper to filter out any stale demo fallback items
function isRealProduct(p) {
  if (!p) return false;
  if (p.isDemoFallback) return false;
  const idStr = String(p._id || p.id || '');
  if (idStr.startsWith('fallback_')) return false;
  return true;
}

function getLocalProducts() {
  try {
    const raw = localStorage.getItem('karigar_local_products');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRealProduct) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalProducts(products) {
  try {
    const clean = Array.isArray(products) ? products.filter(isRealProduct) : [];
    localStorage.setItem('karigar_local_products', JSON.stringify(clean));
  } catch (e) {}
}

/**
 * Clean all user caches of demo fallback products
 */
export function purgeDemoFallbackProducts() {
  if (typeof window === 'undefined') return;
  try {
    // 1. Clean karigar_local_products
    const locals = getLocalProducts();
    saveLocalProducts(locals);

    // 2. Clean all karigar_products_* keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('karigar_products_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter(isRealProduct);
            localStorage.setItem(key, JSON.stringify(cleaned));
          }
        }
      }
    }
  } catch (e) {}
}

/**
 * Get all products for authenticated artisan
 * GET /api/products
 */
export async function getProducts(token) {
  purgeDemoFallbackProducts();
  try {
    const res = await apiRequest('/products', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res && Array.isArray(res.products)) {
      const cleanProducts = res.products.filter(isRealProduct);
      return {
        ...res,
        products: cleanProducts
      };
    }
  } catch (err) {
    console.warn('Backend getProducts unavailable, using local catalogue:', err.message);
  }
  const locals = getLocalProducts();
  return {
    success: true,
    products: locals,
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
    if (res && (res.product || res.data)) {
      const prod = res.product || res.data;
      if (isRealProduct(prod)) return res;
    }
  } catch (err) {
    console.warn('Backend getProductById unavailable, searching local products:', err.message);
  }
  const all = getLocalProducts();
  const found = all.find(p => (p._id || p.id) === id);
  return {
    success: Boolean(found),
    product: found || null
  };
}

/**
 * Create new product listing
 * POST /api/products
 */
export async function createProduct(productData, token) {
  let created = null;
  try {
    const res = await apiRequest('/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
    if (res && res.product) {
      created = res.product;
    }
  } catch (err) {
    console.warn('Backend createProduct unavailable, storing product locally:', err.message);
  }

  if (!created) {
    created = {
      ...productData,
      _id: 'local_prod_' + Date.now(),
      id: 'local_prod_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: productData.status || 'Market-Ready'
    };
  }

  const locals = getLocalProducts();
  saveLocalProducts([created, ...locals.filter(p => (p._id || p.id) !== (created._id || created.id))]);

  return {
    success: true,
    product: created
  };
}

/**
 * Update product by ID
 * PUT /api/products/:id
 */
export async function updateProduct(id, productData, token) {
  let updatedProduct = null;
  try {
    const res = await apiRequest(`/products/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
      body: JSON.stringify(productData),
    });
    if (res && res.product) {
      updatedProduct = res.product;
    }
  } catch (err) {
    console.warn('Backend updateProduct unavailable, updating locally:', err.message);
  }

  const locals = getLocalProducts();
  const index = locals.findIndex(p => (p._id || p.id) === id);
  if (index !== -1) {
    locals[index] = { ...locals[index], ...productData, updatedAt: new Date().toISOString() };
    if (!updatedProduct) updatedProduct = locals[index];
    saveLocalProducts(locals);
  } else if (!updatedProduct) {
    updatedProduct = { _id: id, id, ...productData };
  }

  // Also sync with all user caches in localStorage
  if (typeof window !== 'undefined' && updatedProduct) {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('karigar_products_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const updatedArr = arr.map(p => (p._id || p.id) === id ? { ...p, ...updatedProduct } : p);
              localStorage.setItem(key, JSON.stringify(updatedArr));
            }
          }
        }
      }
    } catch (e) {}
  }

  return {
    success: true,
    product: updatedProduct
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
    await apiRequest(`/products/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 3000,
    });
  } catch (err) {
    console.warn('Backend deleteProduct unavailable, deleting locally:', err.message);
  }

  // 1. Remove from generic local products
  const locals = getLocalProducts();
  const filtered = locals.filter(p => (p._id || p.id) !== id && p._id !== id && p.id !== id);
  saveLocalProducts(filtered);

  // 2. Remove from all user-specific caches in localStorage
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('karigar_products_') || key === 'karigar_local_products')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              const updated = arr.filter(p => (p._id || p.id) !== id && p._id !== id && p.id !== id);
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        }
      }
    } catch (e) {}
  }

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
  const idx = locals.findIndex(p => (p._id || p.id) === id);
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


