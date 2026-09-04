import Product from '../models/product.model.js';
import { calculateDynamicPricing } from '../services/pricing.service.js';

/**
 * Main Dynamic Pricing Assistant Analysis Endpoint
 * POST /api/pricing/analyze
 */
export const analyzePricingController = async (req, res) => {
  try {
    const {
      productId,
      materialCost,
      labourCost,
      packagingCost,
      otherCost,
      category,
      productType,
      material,
      craftType,
      description,
    } = req.body;

    let productDoc = null;
    let inputData = {
      materialCost,
      labourCost,
      packagingCost,
      otherCost,
      category,
      productType,
      material,
      craftType,
      description,
    };

    // 1. If productId is provided, securely load product from database
    if (productId && productId !== 'temp' && !String(productId).startsWith('mock') && !String(productId).startsWith('fallback_')) {
      productDoc = await Product.findById(productId);

      if (!productDoc) {
        return res.status(404).json({
          success: false,
          message: 'Product not found in database.',
        });
      }

      // Security check: Verify authenticated user ownership
      if (req.user && productDoc.artisan.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You do not have permission to access or price this product.',
        });
      }

      // Merge verified database product context
      inputData = {
        materialCost: materialCost !== undefined ? materialCost : productDoc.materialCost || 0,
        labourCost: labourCost !== undefined ? labourCost : productDoc.labourCost || 0,
        packagingCost: packagingCost !== undefined ? packagingCost : productDoc.packagingCost || 0,
        otherCost: otherCost !== undefined ? otherCost : productDoc.otherCost || 0,
        category: category || productDoc.category || 'General Craft',
        productType: productType || productDoc.name || 'Craft Item',
        material: material || productDoc.material || '',
        craftType: craftType || productDoc.craftType || '',
        description: description || productDoc.description || '',
        keywords: productDoc.tags || [],
      };
    }

    // 2. Run Explainable Dynamic Pricing Engine
    const result = await calculateDynamicPricing(inputData);

    return res.status(200).json({
      success: true,
      message: 'AI-assisted Dynamic Price Recommendation generated successfully',
      productId: productDoc?._id || productId || null,
      ...result,
    });
  } catch (error) {
    console.error('Analyze Pricing Error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to analyze dynamic pricing',
    });
  }
};

/**
 * Calculate AI-assisted Smart Price Recommendation from raw inputs (legacy alias)
 * POST /api/pricing/calculate
 */
export const calculateSmartPricingController = async (req, res) => {
  return analyzePricingController(req, res);
};

/**
 * Calculate and apply Smart Price Recommendation for a specific Product
 * POST /api/products/:id/pricing
 */
export const calculateProductPricingController = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in database',
      });
    }

    // Security check: Ownership isolation
    if (req.user && product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to modify pricing for this product',
      });
    }

    const {
      materialCost,
      labourCost,
      packagingCost,
      otherCost,
      applyToProduct,
      customPrice,
    } = req.body;

    const inputData = {
      materialCost: materialCost !== undefined ? materialCost : product.materialCost || 0,
      labourCost: labourCost !== undefined ? labourCost : product.labourCost || 0,
      packagingCost: packagingCost !== undefined ? packagingCost : product.packagingCost || 0,
      otherCost: otherCost !== undefined ? otherCost : product.otherCost || 0,
      category: product.category || 'General Craft',
      productType: product.name || 'Craft Item',
      material: product.material || '',
      craftType: product.craftType || '',
      description: product.description || '',
      keywords: product.tags || [],
    };

    const result = await calculateDynamicPricing(inputData);

    // If artisan chooses to commit the price to MongoDB
    if (applyToProduct === true || customPrice !== undefined) {
      const priceToSave = customPrice ? parseFloat(customPrice) : result.pricing.recommendedPrice;
      product.price = priceToSave;
      product.materialCost = result.costBreakdown.materialCost;
      product.labourCost = result.costBreakdown.labourCost;
      product.packagingCost = result.costBreakdown.packagingCost;
      product.otherCost = result.costBreakdown.otherCost;
      
      // Save pricing metadata
      product.pricingRecommendation = {
        recommendedPrice: result.pricing.recommendedPrice,
        minimumPrice: result.pricing.minimumPrice,
        premiumPrice: result.pricing.premiumPrice,
        confidence: result.pricing.confidence,
        marketRange: result.marketData.formattedRange,
        calculatedAt: new Date(),
      };

      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Dynamic Price Recommendation calculated and updated',
      product,
      ...result,
    });
  } catch (error) {
    console.error('Calculate Product Pricing Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to calculate product pricing',
    });
  }
};

export default {
  analyzePricingController,
  calculateSmartPricingController,
  calculateProductPricingController,
};
