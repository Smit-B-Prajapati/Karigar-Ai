import { analyzeProductImage as runAiAnalysis } from '../services/ai.service.js';
import Product from '../models/product.model.js';

/**
 * Analyze an uploaded craft image using Multimodal AI
 * POST /api/ai/analyze-image
 */
export const analyzeImageController = async (req, res) => {
  try {
    const { image, photo, imageData, productId, name, category } = req.body;

    let imageInput = image || photo || imageData;
    let context = { name, category };

    // If productId is provided without direct image payload, load from database
    if (!imageInput && productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found for analysis',
        });
      }

      // Security check: Ownership isolation
      if (product.artisan.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to analyze this product',
        });
      }

      imageInput = product.originalImage || product.enhancedImage;
      context = { name: product.name, category: product.category };
    }

    if (!imageInput) {
      return res.status(400).json({
        success: false,
        message: 'No image provided for AI analysis. Please upload or select a craft photo.',
      });
    }

    const result = await runAiAnalysis(imageInput, context);

    res.status(200).json({
      success: true,
      message: 'Product image analyzed successfully',
      engine: result.engine,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error('AI Image Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI image analysis failed',
    });
  }
};

/**
 * Analyze a specific product's saved image by ID
 * POST /api/products/:id/analyze
 */
export const analyzeProductByIdController = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Security check: Ownership isolation
    if (product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to analyze this product',
      });
    }

    const imageToAnalyze = product.originalImage || product.enhancedImage;

    if (!imageToAnalyze) {
      return res.status(400).json({
        success: false,
        message: 'This product does not have an uploaded image to analyze yet.',
      });
    }

    const result = await runAiAnalysis(imageToAnalyze, {
      name: product.name,
      category: product.category,
    });

    res.status(200).json({
      success: true,
      message: 'Product image analyzed successfully',
      engine: result.engine,
      analysis: result.analysis,
      product,
    });
  } catch (error) {
    console.error('Analyze Product By ID Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze product image',
    });
  }
};
