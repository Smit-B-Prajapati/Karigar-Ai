import { apiRequest } from './api.js';
import { fileToBase64 } from './productService.js';
import { optimizeImageForUpload } from '../utils/imageOptimizer.js';

/**
 * Resolve relative image URL (like /uploads/products/xyz.jpg) to full server URL
 */
export function resolveImageUrl(urlOrPath) {
  if (!urlOrPath) return '';
  if (urlOrPath.startsWith('data:') || urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://') || urlOrPath.startsWith('blob:')) {
    return urlOrPath;
  }
  let serverOrigin = '';
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isMobileOrLan = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (!isMobileOrLan && envUrl && !envUrl.startsWith('/')) {
      serverOrigin = envUrl.replace(/\/api\/?$/, '');
    }
  }
  return `${serverOrigin}${urlOrPath.startsWith('/') ? '' : '/'}${urlOrPath}`;
}

/**
 * Enhance product photo using backend POST /api/image/enhance API
 * @param {string|File|Blob} imageInput 
 * @param {string} token 
 * @param {object} [options] 
 * @returns {Promise<{ success: boolean, isConfigured?: boolean, originalImageUrl?: string, enhancedImageUrl?: string, enhancedBase64?: string, message?: string, engine?: string }>}
 */
export async function enhanceRawImage(imageInput, token = null, options = {}) {
  let imagePayload = imageInput;

  // Always optimize image client-side to ensure rapid mobile transmission (<300KB)
  try {
    const optimized = await optimizeImageForUpload(imageInput, { maxDimension: 1200, quality: 0.85 });
    imagePayload = optimized.base64;
  } catch (optErr) {
    console.warn('Pre-upload optimization skipped/fallback:', optErr);
    if (imageInput instanceof File || imageInput instanceof Blob) {
      const converted = await fileToBase64(imageInput);
      imagePayload = converted.image;
    }
  }

  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiRequest('/image/enhance', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: imagePayload,
        productId: options.productId || 'temp',
        preset: options.preset || 'Studio Clean White',
      }),
    });

    if (res && res.success && (res.enhancedImageUrl || res.enhancedBase64)) {
      const fullEnhancedUrl = resolveImageUrl(res.enhancedImageUrl);
      const fullOriginalUrl = resolveImageUrl(res.originalImageUrl) || imagePayload;

      return {
        success: true,
        isConfigured: true,
        originalImageUrl: fullOriginalUrl,
        enhancedImageUrl: fullEnhancedUrl,
        enhancedBase64: res.enhancedBase64 || fullEnhancedUrl,
        message: res.message || 'Image enhanced successfully',
        engine: res.engine || 'removebg-sharp-compositing-engine',
        enhancementDetails: res.enhancementDetails,
      };
    }

    // Handle missing API key or fallback
    return {
      success: false,
      isConfigured: res?.isConfigured !== false,
      originalImageUrl: resolveImageUrl(res?.originalImageUrl) || imagePayload,
      enhancedImageUrl: resolveImageUrl(res?.originalImageUrl) || imagePayload,
      message: res?.message || 'Photo enhancement is temporarily unavailable.',
      fallback: 'continue_with_original',
    };
  } catch (err) {
    console.warn('Backend /api/image/enhance call error:', err.message);
    return {
      success: false,
      isConfigured: false,
      originalImageUrl: typeof imageInput === 'string' ? imageInput : '',
      enhancedImageUrl: typeof imageInput === 'string' ? imageInput : '',
      message: err.message || 'Photo enhancement is temporarily unavailable.',
      fallback: 'continue_with_original',
    };
  }
}

/**
 * Enhance a product's photo by Product ID
 * POST /api/products/:id/enhance
 */
export async function enhanceProductById(productId, token, options = {}) {
  try {
    const res = await apiRequest(`/products/${productId}/enhance`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        preset: options.preset || 'Studio Clean White',
        cropSquare: options.cropSquare !== false,
        saveToProduct: options.saveToProduct !== false,
      }),
    });

    if (res && res.enhancedImageUrl) {
      res.enhancedImageUrl = resolveImageUrl(res.enhancedImageUrl);
    }
    if (res && res.originalImageUrl) {
      res.originalImageUrl = resolveImageUrl(res.originalImageUrl);
    }

    return res;
  } catch (err) {
    console.warn('enhanceProductById API call failed:', err.message);
    throw err;
  }
}

/**
 * General photo enhancement helper
 */
export async function enhancePhoto(imageInput, productId = null, options = {}, token = null) {
  if (productId && !String(productId).startsWith('temp')) {
    try {
      return await enhanceProductById(productId, token, options);
    } catch (e) {
      console.warn('enhanceProductById failed, falling back to raw enhancement:', e.message);
    }
  }
  return await enhanceRawImage(imageInput, token, { ...options, productId });
}

export default {
  resolveImageUrl,
  enhanceRawImage,
  enhanceProductById,
  enhancePhoto,
};
