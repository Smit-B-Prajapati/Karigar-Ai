import mongoose from 'mongoose';
import { generateBusinessAdvice } from '../services/advisor.service.js';
import { analyzeProductImage } from '../services/ai.service.js';
import Product from '../models/product.model.js';

/**
 * Endpoint to generate AI Business Advisor recommendations
 * POST /api/ai/advisor
 */
export const getBusinessAdviceController = async (req, res) => {
  try {
    const { question, productContext = {}, productId, conversationHistory = [], language = 'EN' } = req.body;

    let mergedContext = { ...productContext };

    // If valid database productId is provided, load product from DB to enrich context
    const isRealDbProduct = productId && 
      mongoose.Types.ObjectId.isValid(productId) && 
      !String(productId).startsWith('mock') && 
      !String(productId).startsWith('fallback_');

    if (isRealDbProduct) {
      try {
        const product = await Product.findById(productId);
        if (product && product.artisan.toString() === req.user._id.toString()) {
          mergedContext = {
            name: product.name,
            title: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            material: product.material,
            craftType: product.craftType,
            tags: product.tags,
            productImage: product.enhancedImage || product.originalImage,
            ...mergedContext,
          };

          // If image analysis not present, perform quick visual analysis
          if (!mergedContext.imageAnalysis && (product.originalImage || product.enhancedImage)) {
            try {
              const visualRes = await analyzeProductImage(product.originalImage || product.enhancedImage, {
                name: product.name,
                category: product.category,
              });
              if (visualRes.success) {
                mergedContext.imageAnalysis = visualRes.analysis;
              }
            } catch (vErr) {
              console.warn('Visual analysis auto-fetch for advisor warning:', vErr.message);
            }
          }
        }
      } catch (dbErr) {
        console.warn('Product findById warning in advisor controller:', dbErr.message);
      }
    }

    const result = await generateBusinessAdvice({
      question: question || 'How can I sell this product better?',
      productContext: mergedContext,
      conversationHistory,
      language,
    });

    return res.status(200).json({
      success: true,
      message: 'Business advice generated successfully',
      engine: result.engine,
      advice: result.adviceData,
    });
  } catch (error) {
    console.error('AI Business Advisor Controller Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI business advice',
    });
  }
};

/**
 * Generate AI Business Advisor advice directly for a specific saved product ID
 * POST /api/products/:id/advisor
 */
export const getBusinessAdviceForProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, conversationHistory = [], language = 'EN' } = req.body;

    const product = await Product.findById(id);
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
        message: 'Forbidden: You do not have permission to access advice for this product',
      });
    }

    let imageAnalysis = null;
    const imageToAnalyze = product.originalImage || product.enhancedImage;
    if (imageToAnalyze) {
      try {
        const visualRes = await analyzeProductImage(imageToAnalyze, {
          name: product.name,
          category: product.category,
        });
        if (visualRes.success) {
          imageAnalysis = visualRes.analysis;
        }
      } catch (visualErr) {
        console.warn('Visual analysis auto-run in advisor controller failed:', visualErr.message);
      }
    }

    const productContext = {
      productId: product._id.toString(),
      name: product.name,
      title: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      material: product.material,
      craftType: product.craftType,
      tags: product.tags,
      productImage: imageToAnalyze,
      imageAnalysis,
    };

    const result = await generateBusinessAdvice({
      question: question || 'How can I sell this product better?',
      productContext,
      conversationHistory,
      language,
    });

    return res.status(200).json({
      success: true,
      message: 'Product business advice generated successfully',
      engine: result.engine,
      advice: result.adviceData,
      product,
    });
  } catch (error) {
    console.error('Product Business Advisor Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate product business advice',
    });
  }
};

export default {
  getBusinessAdviceController,
  getBusinessAdviceForProductController,
};
