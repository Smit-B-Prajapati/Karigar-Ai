import Product from '../models/product.model.js';
import { exportCatalogueJson, exportCatalogueCsv, formatProductForExport } from '../services/marketplace.service.js';

/**
 * Export all products belonging to authenticated artisan
 * GET /api/marketplace/export?format=json|csv
 */
export const exportAllProductsController = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const products = await Product.find({ artisan: req.user._id })
      .populate('artisan', 'name email location craftSpecialty')
      .sort({ createdAt: -1 });

    if (format.toLowerCase() === 'csv') {
      const csvData = exportCatalogueCsv(products, req.user);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="karigar-catalogue-${Date.now()}.csv"`);
      return res.status(200).send(csvData);
    }

    // Default: JSON Export
    const jsonData = exportCatalogueJson(products, req.user);
    res.status(200).json({
      success: true,
      message: 'Catalogue exported successfully',
      exportFormat: 'JSON',
      ...jsonData,
    });
  } catch (error) {
    console.error('Export Catalogue Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export product catalogue',
    });
  }
};

/**
 * Export single product by ID
 * GET /api/products/:id/export?format=json|csv
 */
export const exportSingleProductController = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;

    const product = await Product.findById(id).populate('artisan', 'name email location craftSpecialty');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Ownership check
    const artisanId = product.artisan._id ? product.artisan._id.toString() : product.artisan.toString();
    if (artisanId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to export this product',
      });
    }

    if (format.toLowerCase() === 'csv') {
      const csvData = exportCatalogueCsv([product], req.user);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="karigar-product-${id}.csv"`);
      return res.status(200).send(csvData);
    }

    const formatted = formatProductForExport(product, req.user);
    res.status(200).json({
      success: true,
      message: 'Product exported successfully',
      exportFormat: 'JSON',
      product: formatted,
    });
  } catch (error) {
    console.error('Export Single Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to export product',
    });
  }
};

/**
 * Get Marketplace Preview structure for a product
 * GET /api/products/:id/marketplace-preview
 */
export const getMarketplacePreviewController = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('artisan', 'name email location craftSpecialty createdAt');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const formatted = formatProductForExport(product, product.artisan || req.user);

    res.status(200).json({
      success: true,
      message: 'Marketplace preview generated',
      preview: formatted,
      product,
    });
  } catch (error) {
    console.error('Get Marketplace Preview Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load marketplace preview',
    });
  }
};
