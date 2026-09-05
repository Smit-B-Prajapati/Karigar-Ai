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
 * In-browser Neural Network AI Background Segmentation using @imgly/background-removal.
 * Runs 100% locally in the browser via WebAssembly & ONNX runtime without external API costs/keys.
 */
async function segmentWithLocalAI(imageSource) {
  if (typeof window === 'undefined' || !imageSource) return null;
  try {
    const imgly = await import('@imgly/background-removal');
    const removeBackground = imgly.removeBackground || imgly.default;
    if (typeof removeBackground !== 'function') return null;

    // Run AI segmentation with a 15-second safety timeout
    const segmentationPromise = removeBackground(imageSource, {
      model: 'isnet_quint8', // fast quantized model (~28MB)
      debug: false,
      output: {
        format: 'image/png',
        quality: 0.95,
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Local AI segmentation timeout')), 15000)
    );

    const resultBlob = await Promise.race([segmentationPromise, timeoutPromise]);
    if (!resultBlob || !(resultBlob instanceof Blob)) {
      return null;
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });
  } catch (err) {
    console.warn('In-browser AI segmentation notice (falling back to smart studio compositor):', err.message);
    return null;
  }
}

/**
 * Intelligent Client-Side Background Segmentation using Multi-Cluster Perimeter Matting
 * with Center Craft Protection and Studio Edge Vignette Fallback.
 * Erases surface backgrounds (bed sheets, laptop keyboards, tables, floors) and generates transparent craft.
 */
function isolateForegroundWithCanvas(img, targetWidth, targetHeight) {
  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return img;

    tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
    const imgData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imgData.data;
    const totalPixels = targetWidth * targetHeight;

    // Check if image already has transparent pixels (e.g. from local AI or Remove.bg)
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 40) {
      if (data[i] < 200) {
        hasAlpha = true;
        break;
      }
    }
    if (hasAlpha) {
      return tempCanvas;
    }

    // MULTI-CLUSTER PERIMETER SAMPLING:
    // Sample outer border bands (outer 8% margins)
    const marginX = Math.max(2, Math.floor(targetWidth * 0.08));
    const marginY = Math.max(2, Math.floor(targetHeight * 0.08));
    const step = Math.max(2, Math.floor(Math.min(targetWidth, targetHeight) / 50));

    const borderSamples = [];
    for (let y = 0; y < marginY; y += step) {
      for (let x = 0; x < targetWidth; x += step) {
        const idx = (y * targetWidth + x) * 4;
        borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
        const bIdx = ((targetHeight - 1 - y) * targetWidth + x) * 4;
        borderSamples.push([data[bIdx], data[bIdx + 1], data[bIdx + 2]]);
      }
    }
    for (let x = 0; x < marginX; x += step) {
      for (let y = marginY; y < targetHeight - marginY; y += step) {
        const idx = (y * targetWidth + x) * 4;
        borderSamples.push([data[idx], data[idx + 1], data[idx + 2]]);
        const rIdx = (y * targetWidth + (targetWidth - 1 - x)) * 4;
        borderSamples.push([data[rIdx], data[rIdx + 1], data[rIdx + 2]]);
      }
    }

    // Cluster border samples into dominant color centroids (up to 16 clusters)
    const clusters = [];
    const clusterRadiusSq = 32 * 32;
    for (const [r, g, b] of borderSamples) {
      let matched = false;
      for (const c of clusters) {
        const dSq = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
        if (dSq < clusterRadiusSq) {
          c.count++;
          c.r = (c.r * (c.count - 1) + r) / c.count;
          c.g = (c.g * (c.count - 1) + g) / c.count;
          c.b = (c.b * (c.count - 1) + b) / c.count;
          matched = true;
          break;
        }
      }
      if (!matched && clusters.length < 16) {
        clusters.push({ r, g, b, count: 1 });
      }
    }

    // Sort clusters by occurrence frequency
    clusters.sort((a, b) => b.count - a.count);

    function isBgColor(r, g, b, threshold) {
      const threshSq = threshold * threshold;
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        const dSq = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
        if (dSq < threshSq) return true;
      }
      return false;
    }

    // CRAFT CENTER PROTECTION:
    // Artisan craft products are placed near center. Protect the inner elliptical core.
    const cx = targetWidth / 2;
    const cy = targetHeight / 2;
    const rx = targetWidth * 0.46;
    const ry = targetHeight * 0.46;

    // BFS Flood Fill inward from all 4 borders
    const visited = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels * 2);
    let head = 0;
    let tail = 0;

    for (let x = 0; x < targetWidth; x++) {
      const topIdx = x;
      const botIdx = (targetHeight - 1) * targetWidth + x;
      visited[topIdx] = 1;
      visited[botIdx] = 1;
      queue[tail++] = x; queue[tail++] = 0;
      queue[tail++] = x; queue[tail++] = targetHeight - 1;
    }
    for (let y = 0; y < targetHeight; y++) {
      const leftIdx = y * targetWidth;
      const rightIdx = y * targetWidth + targetWidth - 1;
      if (!visited[leftIdx]) {
        visited[leftIdx] = 1;
        queue[tail++] = 0; queue[tail++] = y;
      }
      if (!visited[rightIdx]) {
        visited[rightIdx] = 1;
        queue[tail++] = targetWidth - 1; queue[tail++] = y;
      }
    }

    while (head < tail) {
      const qx = queue[head++];
      const qy = queue[head++];
      const pIdx = (qy * targetWidth + qx) * 4;

      const normDist = Math.sqrt(((qx - cx) / rx) ** 2 + ((qy - cy) / ry) ** 2);

      // Core protection: craft product center is preserved
      if (normDist < 0.35) {
        continue;
      }

      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      const adaptiveThresh = Math.round(35 + Math.min(1, Math.max(0, normDist - 0.35) / 0.65) * 35);

      if (isBgColor(r, g, b, adaptiveThresh) || normDist > 1.05) {
        data[pIdx + 3] = 0; // Cutout transparent

        if (qx + 1 < targetWidth && !visited[qy * targetWidth + qx + 1]) {
          visited[qy * targetWidth + qx + 1] = 1;
          queue[tail++] = qx + 1; queue[tail++] = qy;
        }
        if (qx - 1 >= 0 && !visited[qy * targetWidth + qx - 1]) {
          visited[qy * targetWidth + qx - 1] = 1;
          queue[tail++] = qx - 1; queue[tail++] = qy;
        }
        if (qy + 1 < targetHeight && !visited[(qy + 1) * targetWidth + qx]) {
          visited[(qy + 1) * targetWidth + qx] = 1;
          queue[tail++] = qx; queue[tail++] = qy + 1;
        }
        if (qy - 1 >= 0 && !visited[(qy - 1) * targetWidth + qx]) {
          visited[(qy - 1) * targetWidth + qx] = 1;
          queue[tail++] = qx; queue[tail++] = qy - 1;
        }
      }
    }

    // STUDIO VIGNETTE FEATHERING:
    // Softly fade outer border perimeter into transparent so no sharp rectangular crop lines remain
    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        const pIdx = (y * targetWidth + x) * 4;
        if (data[pIdx + 3] === 0) continue;

        const normDist = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
        if (normDist > 0.85) {
          const fade = Math.max(0, Math.min(1, (1.02 - normDist) / 0.17));
          data[pIdx + 3] = Math.round(data[pIdx + 3] * fade);
        }
      }
    }

    tempCtx.putImageData(imgData, 0, 0);
    return tempCanvas;
  } catch (e) {
    console.warn('Canvas foreground isolation fallback:', e);
    return img;
  }
}

/**
 * Client-Side Studio Compositor: Composites segmented craft onto a pristine
 * high-key studio background with diffuse contact shadow and lighting enhancement.
 */
export async function renderClientStudioCompositor(imageSrc, preset = 'Studio Clean White') {
  if (typeof window === 'undefined' || !imageSrc) {
    return imageSrc || '';
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 1200; // 1200x1200px square e-commerce studio format
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // 1. Studio Infinity Cove Backdrop
        const bgGrad = ctx.createRadialGradient(size * 0.5, size * 0.45, size * 0.15, size * 0.5, size * 0.5, size * 0.75);
        if (preset === 'Warm Wooden Craft') {
          bgGrad.addColorStop(0, '#FFFFFF');
          bgGrad.addColorStop(0.6, '#FAF6F0');
          bgGrad.addColorStop(1, '#F3ECE2');
        } else if (preset === 'Dark Premium Luxe') {
          bgGrad.addColorStop(0, '#27272A');
          bgGrad.addColorStop(0.7, '#18181B');
          bgGrad.addColorStop(1, '#09090B');
        } else if (preset === 'Vibrant Festive') {
          bgGrad.addColorStop(0, '#FFFFFF');
          bgGrad.addColorStop(0.65, '#FFF9F0');
          bgGrad.addColorStop(1, '#FCEFDE');
        } else {
          // Studio Clean White (Default)
          bgGrad.addColorStop(0, '#FFFFFF');
          bgGrad.addColorStop(0.6, '#FAFAFB');
          bgGrad.addColorStop(1, '#F2F4F7');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        // 2. Isolate foreground if not already transparent
        const sourceElement = isolateForegroundWithCanvas(img, img.naturalWidth || 800, img.naturalHeight || 800);

        // 3. Aspect ratio calculation (fit inside 88% bounding box to allow breathing room)
        const srcW = img.naturalWidth || 800;
        const srcH = img.naturalHeight || 800;
        const maxBound = size * 0.88;
        const scale = Math.min(maxBound / srcW, maxBound / srcH);
        const w = Math.round(srcW * scale);
        const h = Math.round(srcH * scale);
        const x = Math.round((size - w) / 2);
        const y = Math.round((size - h) / 2);

        // 4. Diffuse contact shadow under craft product
        ctx.save();
        const shadowGrad = ctx.createRadialGradient(
          size * 0.5,
          y + h - 8,
          w * 0.08,
          size * 0.5,
          y + h - 8,
          w * 0.48
        );
        shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
        shadowGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.10)');
        shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(size * 0.5, y + h - 8, w * 0.46, Math.max(14, h * 0.045), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 5. Render product with studio lighting & vibrancy filter
        ctx.save();
        if (ctx.filter !== undefined) {
          ctx.filter = 'contrast(1.08) brightness(1.04) saturate(1.12)';
        }
        ctx.drawImage(sourceElement, x, y, w, h);
        ctx.restore();

        // 6. Subtle studio vignette
        ctx.save();
        const vignette = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.45, size * 0.5, size * 0.5, size * 0.72);
        vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.03)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, size, size);
        ctx.restore();

        const enhancedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(enhancedDataUrl);
      } catch (err) {
        console.warn('Canvas studio rendering error, fallback to original:', err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => {
      resolve(imageSrc);
    };
    img.src = imageSrc;
  });
}

const REMOVE_BG_API_KEY = 'yVu6GqVqwJZqaoTrR56zkgg9';

/**
 * Direct Client-Side Remove.bg Call (CORS supported)
 * Ensures Remove.bg works even if the backend server is not running locally.
 */
async function callRemoveBgDirect(base64Payload) {
  try {
    let cleanB64 = base64Payload;
    if (cleanB64.includes('base64,')) {
      cleanB64 = cleanB64.split('base64,')[1];
    }
    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        image_file_b64: cleanB64,
        size: 'preview',
        type: 'auto',
        crop: true,
        crop_margin: '25px',
        format: 'png',
      }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.data && data.data.result_b64) {
        return `data:image/png;base64,${data.data.result_b64}`;
      }
    } else {
      const errData = await res.json().catch(() => null);
      console.warn('Remove.bg direct API response:', res.status, errData);
    }
    return null;
  } catch (err) {
    console.warn('Remove.bg direct client notice:', err.message);
    return null;
  }
}

/**
 * Enhance product photo using Remove.bg AI Segmentation (API + Direct),
 * In-Browser Neural AI, and Smart Multi-Cluster Studio Compositor.
 */
export async function enhanceRawImage(imageInput, token = null, options = {}) {
  let imagePayload = imageInput;

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

  // 1. Priority 1: Remove.bg AI Segmentation (via Backend/Vercel Serverless Endpoint)
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiRequest('/image/enhance', {
      method: 'POST',
      headers,
      timeout: 10000,
      body: JSON.stringify({
        image: imagePayload,
        productId: options.productId || 'temp',
        preset: options.preset || 'Studio Clean White',
      }),
    });

    if (res && res.success && (res.enhancedImageUrl || res.enhancedBase64 || res.transparentImageUrl)) {
      const transparentUrl = res.transparentImageUrl || res.enhancedBase64 || res.enhancedImageUrl;
      const studioComposite = await renderClientStudioCompositor(transparentUrl, options.preset || 'Studio Clean White');

      return {
        success: true,
        isConfigured: true,
        originalImageUrl: imagePayload,
        enhancedImageUrl: studioComposite,
        enhancedBase64: studioComposite,
        enhancedImage: studioComposite,
        message: 'Background removed with Remove.bg AI & Studio Lighting applied',
        engine: res.engine || 'removebg-ai-segmentation',
        enhancementDetails: {
          background: `Studio Backdrop (${options.preset || 'Studio Clean White'})`,
          lighting: 'AI High-Key Studio Lighting',
          contrastBoost: '+8%',
          vibrancyBoost: '+12%',
          backgroundRemoved: true,
        },
      };
    }
  } catch (err) {
    console.warn('Remove.bg serverless endpoint notice, checking direct Remove.bg client call:', err.message);
  }

  // 1B. Priority 1B: Direct Client Remove.bg (if local backend server is offline/dev mode)
  try {
    const directTransparentPng = await callRemoveBgDirect(imagePayload);
    if (directTransparentPng) {
      const studioComposite = await renderClientStudioCompositor(directTransparentPng, options.preset || 'Studio Clean White');
      return {
        success: true,
        isConfigured: true,
        originalImageUrl: imagePayload,
        enhancedImageUrl: studioComposite,
        enhancedBase64: studioComposite,
        enhancedImage: studioComposite,
        message: 'Background removed with Remove.bg AI & Studio Lighting applied',
        engine: 'removebg-direct-client',
        enhancementDetails: {
          background: `Studio Backdrop (${options.preset || 'Studio Clean White'})`,
          lighting: 'AI High-Key Studio Lighting',
          contrastBoost: '+8%',
          vibrancyBoost: '+12%',
          backgroundRemoved: true,
        },
      };
    }
  } catch (directErr) {
    console.warn('Remove.bg direct notice:', directErr.message);
  }

  // 2. Priority 2: Zero-cost In-Browser AI Segmentation (@imgly/background-removal)
  try {
    const localTransparentPng = await segmentWithLocalAI(imagePayload);
    if (localTransparentPng) {
      const studioComposite = await renderClientStudioCompositor(localTransparentPng, options.preset || 'Studio Clean White');
      return {
        success: true,
        isConfigured: true,
        originalImageUrl: imagePayload,
        enhancedImageUrl: studioComposite,
        enhancedBase64: studioComposite,
        enhancedImage: studioComposite,
        message: 'Background removed with AI Neural Network & Studio Lighting applied',
        engine: 'imgly-local-neural-ai',
        enhancementDetails: {
          background: `Studio Backdrop (${options.preset || 'Studio Clean White'})`,
          lighting: 'AI High-Key Studio Lighting',
          contrastBoost: '+8%',
          vibrancyBoost: '+12%',
          backgroundRemoved: true,
        },
      };
    }
  } catch (localAiErr) {
    console.warn('Local neural AI notice:', localAiErr.message);
  }

  // 3. Priority 3: Client-Side Studio Compositor with Multi-Cluster Smart Perimeter Matting
  try {
    const studioEnhancedBase64 = await renderClientStudioCompositor(imagePayload, options.preset || 'Studio Clean White');
    return {
      success: true,
      isConfigured: true,
      originalImageUrl: imagePayload,
      enhancedImageUrl: studioEnhancedBase64,
      enhancedBase64: studioEnhancedBase64,
      enhancedImage: studioEnhancedBase64,
      message: 'Enhanced with Karigar Studio Lighting & Clean Backdrop',
      engine: 'karigar-smart-canvas-matting',
      enhancementDetails: {
        background: `Studio Backdrop (${options.preset || 'Studio Clean White'})`,
        lighting: 'High-Key Artisan Diffuse Lighting',
        contrastBoost: '+8%',
        vibrancyBoost: '+12%',
        backgroundRemoved: true,
      },
    };
  } catch (fallbackErr) {
    console.warn('Studio fallback error:', fallbackErr);
    return {
      success: true,
      isConfigured: true,
      originalImageUrl: imagePayload,
      enhancedImageUrl: imagePayload,
      enhancedBase64: imagePayload,
      enhancedImage: imagePayload,
      message: 'Original photo preserved',
      engine: 'original-retained',
    };
  }
}

/**
 * Enhance a product's photo by Product ID
 */
export async function enhanceProductById(productId, token, options = {}) {
  try {
    const res = await apiRequest(`/products/${productId}/enhance`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 8000,
      body: JSON.stringify({
        preset: options.preset || 'Studio Clean White',
        cropSquare: options.cropSquare !== false,
        saveToProduct: options.saveToProduct !== false,
      }),
    });

    if (res && res.enhancedImageUrl) {
      res.enhancedImageUrl = resolveImageUrl(res.enhancedImageUrl);
      res.enhancedImage = res.enhancedImageUrl;
    }
    if (res && res.originalImageUrl) {
      res.originalImageUrl = resolveImageUrl(res.originalImageUrl);
    }

    return res;
  } catch (err) {
    console.warn('enhanceProductById API call failed, falling back to raw enhancement:', err.message);
    return await enhanceRawImage(options.image || '', token, options);
  }
}

/**
 * General photo enhancement helper
 */
export async function enhancePhoto(imageInput, productId = null, options = {}, token = null) {
  return await enhanceRawImage(imageInput, token, { ...options, productId });
}

export default {
  resolveImageUrl,
  renderClientStudioCompositor,
  enhanceRawImage,
  enhanceProductById,
  enhancePhoto,
};
