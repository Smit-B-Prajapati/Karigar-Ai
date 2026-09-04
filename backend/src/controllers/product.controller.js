import fs from 'fs';
import path from 'path';
import Product from '../models/product.model.js';
import { processUploadedImage } from '../middleware/upload.middleware.js';
import { persistProduct, removeStoredProduct, loadStore } from '../services/storageService.js';

/**
 * Create new product listing for authenticated artisan
 * POST /api/products
 */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      material,
      craftType,
      originalImage,
      enhancedImage,
      price,
      materialCost,
      labourCost,
      packagingCost,
      otherCost,
      tags,
      language,
      status,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Product name is required',
      });
    }

    const product = await Product.create({
      artisan: req.user._id, // Securely bind to authenticated user
      name,
      description: description || '',
      category: category || 'General Craft',
      material: material || '',
      craftType: craftType || '',
      originalImage: originalImage || '',
      enhancedImage: enhancedImage || '',
      price: price ? parseFloat(price) : 0,
      materialCost: materialCost ? parseFloat(materialCost) : 0,
      labourCost: labourCost ? parseFloat(labourCost) : 0,
      packagingCost: packagingCost ? parseFloat(packagingCost) : 0,
      otherCost: otherCost ? parseFloat(otherCost) : 0,
      tags: Array.isArray(tags) ? tags : [],
      language: language || 'EN',
      status: status || 'Draft',
    });

    // Immediately persist to disk store
    persistProduct(product);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product',
    });
  }
};

/**
 * Get all products belonging to authenticated artisan
 * GET /api/products
 */
export const getProducts = async (req, res) => {
  try {
    let products = await Product.find({ artisan: req.user._id })
      .populate('artisan', 'name email location craftSpecialty createdAt')
      .sort({ createdAt: -1 });

    // Fail-safe: If MongoDB returns 0 products, check if persisted disk store has products for this artisan
    if (products.length === 0) {
      const store = loadStore();
      const artisanIdStr = String(req.user._id);
      const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
      
      const matchingStored = store.products.filter(
        (p) => String(p.artisan) === artisanIdStr || (userEmail && String(p.artisan).toLowerCase() === userEmail)
      );

      if (matchingStored.length > 0) {
        console.log(`🔄 Restoring ${matchingStored.length} products from disk store for artisan ${req.user.name || artisanIdStr}`);
        for (const item of matchingStored) {
          try {
            await Product.findByIdAndUpdate(
              item._id,
              { ...item, artisan: req.user._id },
              { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
          } catch (restErr) {
            console.warn('Restore product warning:', restErr.message);
          }
        }
        products = await Product.find({ artisan: req.user._id })
          .populate('artisan', 'name email location craftSpecialty createdAt')
          .sort({ createdAt: -1 });
      }
    }

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch products',
    });
  }
};

/**
 * Get single product by ID (Ownership verified)
 * GET /api/products/:id
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artisan', 'name email location craftSpecialty createdAt');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Security check: Ownership isolation
    if (product.artisan._id ? product.artisan._id.toString() !== req.user._id.toString() : product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this product',
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get Product By ID Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch product',
    });
  }
};

/**
 * Update product by ID (Ownership verified)
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

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
        message: 'Forbidden: You do not have permission to modify this product',
      });
    }

    // Never allow changing ownership field
    delete req.body.artisan;

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (product) {
      persistProduct(product);
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product',
    });
  }
};

/**
 * Delete product by ID (Ownership verified)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res) => {
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
        message: 'Forbidden: You do not have permission to delete this product',
      });
    }

    await Product.findByIdAndDelete(req.params.id);
    removeStoredProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete product',
    });
  }
};

/**
 * Upload craft product image (Ownership verified)
 * POST /api/products/:id/image
 */
export const uploadProductImage = async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // 2. Strict ownership isolation: Artisan must own the product
    if (product.artisan.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to upload images for this product',
      });
    }

    // 3. Process, validate (type, magic bytes, size <5MB), and save image file
    const uploadResult = await processUploadedImage(req, productId);

    // 4. Clean up old local image file if replacing
    if (product.originalImage && product.originalImage.startsWith('/uploads/products/')) {
      try {
        const oldPath = path.resolve(process.cwd(), product.originalImage.replace(/^\//, ''));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (cleanupErr) {
        console.warn('Old image cleanup warning:', cleanupErr.message);
      }
    }

    // 5. Update and persist image reference in MongoDB
    product.originalImage = uploadResult.publicUrl;
    await product.save();
    persistProduct(product);

    res.status(200).json({
      success: true,
      message: 'Product image uploaded and validated successfully',
      imageUrl: uploadResult.publicUrl,
      imageMeta: {
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        size: uploadResult.size,
        uploadedAt: new Date().toISOString(),
      },
      product,
    });
  } catch (error) {
    console.error('Upload Product Image Error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Image upload failed',
    });
  }
};

