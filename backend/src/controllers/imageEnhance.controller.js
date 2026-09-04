import Product from '../models/product.model.js';
import { enhanceProductPhoto } from '../services/imageEnhance.service.js';
import { processUploadedImage } from '../middleware/upload.middleware.js';

/**
 * Handle multipart/form-data or JSON raw image enhancement
 * POST /api/image/enhance
 * POST /api/ai/enhance-image
 */
export const enhanceRawImageController = async (req, res) => {
  try {
    let imageInput = null;
    const productId = req.body.productId || req.query.productId || 'temp';

    // 1. Check if multipart file upload was provided
    if (req.file && req.file.buffer) {
      imageInput = req.file.buffer;
    } else {
      // 2. Otherwise process raw image or base64 from JSON payload
      const rawPayload = req.body.image || req.body.photo || req.body.imageData;
      if (rawPayload) {
        imageInput = rawPayload;
      }
    }

    if (!imageInput) {
      return res.status(400).json({
        success: false,
        message: 'No image file or payload provided for photo enhancement.',
      });
    }

    // 3. Execute Background Removal & Sharp Compositing Pipeline
    const enhancementResult = await enhanceProductPhoto(imageInput, productId);

    if (!enhancementResult.success) {
      return res.status(200).json({
        success: false,
        isConfigured: enhancementResult.isConfigured !== false,
        originalImageUrl: enhancementResult.originalImageUrl || '',
        enhancedImageUrl: enhancementResult.originalImageUrl || '',
        message: enhancementResult.message || 'Photo enhancement is temporarily unavailable.',
        fallback: 'continue_with_original',
      });
    }

    return res.status(200).json({
      success: true,
      originalImageUrl: enhancementResult.originalImageUrl,
      enhancedImageUrl: enhancementResult.enhancedImageUrl,
      enhancedBase64: enhancementResult.enhancedBase64,
      message: enhancementResult.message || 'Product photo enhanced successfully',
      engine: enhancementResult.engine,
      enhancementDetails: enhancementResult.enhancementDetails,
    });
  } catch (error) {
    console.error('Enhance Image Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Photo enhancement failed. Original photo preserved.',
      fallback: 'continue_with_original',
    });
  }
};

/**
 * Enhance product photo by Product ID
 * POST /api/products/:id/enhance
 */
export const enhanceProductByIdController = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Security check: Ownership isolation
    if (req.user && product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to enhance this product',
      });
    }

    const imageToEnhance = product.originalImage || product.photoUrl;
    if (!imageToEnhance) {
      return res.status(400).json({
        success: false,
        message: 'This product has no original photo to enhance. Please upload a photo first.',
      });
    }

    const enhancementResult = await enhanceProductPhoto(imageToEnhance, productId);

    if (!enhancementResult.success) {
      return res.status(200).json({
        success: false,
        isConfigured: enhancementResult.isConfigured !== false,
        originalImageUrl: product.originalImage,
        enhancedImageUrl: product.originalImage,
        message: enhancementResult.message,
        product,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product photo enhanced successfully',
      originalImageUrl: enhancementResult.originalImageUrl,
      enhancedImageUrl: enhancementResult.enhancedImageUrl,
      enhancedBase64: enhancementResult.enhancedBase64,
      product,
    });
  } catch (error) {
    console.error('Enhance Product By ID Controller Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Image enhancement service failed. Original photo preserved.',
    });
  }
};

export default {
  enhanceRawImageController,
  enhanceProductByIdController,
};
