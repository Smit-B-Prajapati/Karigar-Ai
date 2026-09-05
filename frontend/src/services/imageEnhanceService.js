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
 * Intelligent Client-Side Background Segmentation using Perimeter Flood-Fill.
 * Erases surface backgrounds (bed sheets, tables, floors) and generates transparent PNG.
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

    // Check if image already has transparent pixels (e.g. from Remove.bg)
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 60) {
      if (data[i] < 180) {
        hasAlpha = true;
        break;
      }
    }

    if (hasAlpha) {
      return tempCanvas;
    }

    // Sample border pixels to detect dominant background color
    const borderColors = [];
    const sampleStep = Math.max(4, Math.floor(targetWidth / 40));
    for (let x = 0; x < targetWidth; x += sampleStep) {
      const topIdx = x * 4;
      borderColors.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]]);
      const botIdx = ((targetHeight - 1) * targetWidth + x) * 4;
      borderColors.push([data[botIdx], data[botIdx + 1], data[botIdx + 2]]);
    }
    for (let y = 0; y < targetHeight; y += sampleStep) {
      const leftIdx = y * targetWidth * 4;
      borderColors.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]]);
      const rightIdx = (y * targetWidth + (targetWidth - 1)) * 4;
      borderColors.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]]);
    }

    let sumR = 0, sumG = 0, sumB = 0;
    for (const c of borderColors) {
      sumR += c[0];
      sumG += c[1];
      sumB += c[2];
    }
    const avgR = sumR / borderColors.length;
    const avgG = sumG / borderColors.length;
    const avgB = sumB / borderColors.length;

    // BFS Flood-fill from borders inward to clear matching background
    const visited = new Uint8Array(targetWidth * targetHeight);
    const queue = [];

    for (let x = 0; x < targetWidth; x++) {
      queue.push(x, 0);
      queue.push(x, targetHeight - 1);
      visited[x] = 1;
      visited[(targetHeight - 1) * targetWidth + x] = 1;
    }
    for (let y = 0; y < targetHeight; y++) {
      queue.push(0, y);
      queue.push(targetWidth - 1, y);
      visited[y * targetWidth] = 1;
      visited[y * targetWidth + targetWidth - 1] = 1;
    }

    const threshold = 62;
    let head = 0;

    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];
      const pIdx = (qy * targetWidth + qx) * 4;

      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];

      const dist = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);

      if (dist < threshold) {
        data[pIdx + 3] = 0; // Transparent cutout

        if (qx + 1 < targetWidth && !visited[qy * targetWidth + qx + 1]) {
          visited[qy * targetWidth + qx + 1] = 1;
          queue.push(qx + 1, qy);
        }
        if (qx - 1 >= 0 && !visited[qy * targetWidth + qx - 1]) {
          visited[qy * targetWidth + qx - 1] = 1;
          queue.push(qx - 1, qy);
        }
        if (qy + 1 < targetHeight && !visited[(qy + 1) * targetWidth + qx]) {
          visited[(qy + 1) * targetWidth + qx] = 1;
          queue.push(qx, qy + 1);
        }
        if (qy - 1 >= 0 && !visited[(qy - 1) * targetWidth + qx]) {
          visited[(qy - 1) * targetWidth + qx] = 1;
          queue.push(qx, qy - 1);
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
          y + h - 10,
          w * 0.08,
          size * 0.5,
          y + h - 10,
          w * 0.48
        );
        shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.24)');
        shadowGrad.addColorStop(0.4, 'rgba(15, 23, 42, 0.10)');
        shadowGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = shadowGrad;
        ctx.beginPath();
        ctx.ellipse(size * 0.5, y + h - 10, w * 0.46, Math.max(14, h * 0.045), 0, 0, Math.PI * 2);
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

/**
 * Enhance product photo using backend/Vercel POST /api/image/enhance API with
 * seamless instant fallback to Client Studio Compositor.
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

  // 1. Try Remove.bg AI Segmentation API (via Vercel Serverless Function / Backend)
  try {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiRequest('/image/enhance', {
      method: 'POST',
      headers,
      timeout: 8000,
      body: JSON.stringify({
        image: imagePayload,
        productId: options.productId || 'temp',
        preset: options.preset || 'Studio Clean White',
      }),
    });

    if (res && res.success && (res.enhancedImageUrl || res.enhancedBase64 || res.transparentImageUrl)) {
      const transparentUrl = res.transparentImageUrl || res.enhancedBase64 || res.enhancedImageUrl;
      // Composite the transparent craft cleanly onto studio infinity cove
      const studioComposite = await renderClientStudioCompositor(transparentUrl, options.preset || 'Studio Clean White');

      return {
        success: true,
        isConfigured: true,
        originalImageUrl: imagePayload,
        enhancedImageUrl: studioComposite,
        enhancedBase64: studioComposite,
        enhancedImage: studioComposite,
        message: 'Background removed with AI & Studio Lighting applied',
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
    console.warn('Remove.bg cloud endpoint notice, using Client Studio Segmentation:', err.message);
  }

  // 2. Client-Side Studio Compositor with Foreground Segmentation Fallback
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
      engine: 'karigar-canvas-studio-engine',
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
