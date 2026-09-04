import Product from '../models/product.model.js';
import { generateProductCatalogue } from '../services/catalogue.service.js';

/**
 * Generate Multilingual AI Catalogue from Raw Inputs
 * POST /api/ai/generate-catalogue
 */
export const generateCatalogueController = async (req, res) => {
  try {
    const { imageAnalysis, description, attributes, outputLanguage } = req.body;

    const result = await generateProductCatalogue({
      imageAnalysis: imageAnalysis || {},
      description: description || '',
      attributes: attributes || {},
      outputLanguage: outputLanguage || 'en',
    });

    res.status(200).json({
      success: true,
      message: 'AI Multilingual Catalogue generated successfully',
      catalogue: result.catalogue,
      language: result.language,
      engine: result.engine,
    });
  } catch (error) {
    console.error('Generate Catalogue Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate product catalogue',
    });
  }
};

/**
 * Generate and optionally save Multilingual AI Catalogue for a MongoDB Product
 * POST /api/products/:id/generate-catalogue
 */
export const generateProductCatalogueController = async (req, res) => {
  try {
    const productId = req.params.id;
    const { imageAnalysis, description, attributes, outputLanguage, saveToProduct } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in database',
      });
    }

    // Security check: Ownership isolation
    if (product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to generate catalogue for this product',
      });
    }

    // Combine stored product facts with incoming overrides
    const combinedAttributes = {
      name: attributes?.name || product.name,
      category: attributes?.category || product.category,
      material: attributes?.material || product.material,
      craftType: attributes?.craftType || product.craftType,
      ...attributes,
    };

    const combinedDescription = description || product.description || '';

    const result = await generateProductCatalogue({
      imageAnalysis: imageAnalysis || {},
      description: combinedDescription,
      attributes: combinedAttributes,
      outputLanguage: outputLanguage || 'en',
    });

    // Optionally save to product document
    if (saveToProduct === true) {
      if (result.catalogue.title) product.name = result.catalogue.title;
      if (result.catalogue.description) product.description = result.catalogue.description;
      if (result.catalogue.category && result.catalogue.category !== 'Unknown') product.category = result.catalogue.category;
      if (result.catalogue.material && result.catalogue.material !== 'Unknown') product.material = result.catalogue.material;
      if (result.catalogue.craftType && result.catalogue.craftType !== 'Unknown') product.craftType = result.catalogue.craftType;
      if (Array.isArray(result.catalogue.tags)) product.tags = result.catalogue.tags;
      await product.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product catalogue generated successfully',
      catalogue: result.catalogue,
      language: result.language,
      engine: result.engine,
      product,
    });
  } catch (error) {
    console.error('Generate Product Catalogue Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate catalogue for product',
    });
  }
};
