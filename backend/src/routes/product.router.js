import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../controllers/product.controller.js';
import { analyzeProductByIdController } from '../controllers/ai.controller.js';
import { enhanceProductByIdController } from '../controllers/imageEnhance.controller.js';
import { generateProductCatalogueController } from '../controllers/catalogue.controller.js';
import { calculateProductPricingController } from '../controllers/pricing.controller.js';
import { exportSingleProductController, getMarketplacePreviewController } from '../controllers/marketplace.controller.js';
import { getBusinessAdviceForProductController } from '../controllers/advisor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all product endpoints
router.use(protect);

router.route('/')
  .get(getProducts)
  .post(createProduct);

router.route('/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

// Image Upload Endpoint -> POST /api/products/:id/image
router.post('/:id/image', uploadProductImage);

// AI Image Analysis Endpoint for Product -> POST /api/products/:id/analyze
router.post('/:id/analyze', analyzeProductByIdController);

// AI Image Enhancement Endpoint for Product -> POST /api/products/:id/enhance
router.post('/:id/enhance', enhanceProductByIdController);

// AI Multilingual Catalogue Generator -> POST /api/products/:id/generate-catalogue
router.post('/:id/generate-catalogue', generateProductCatalogueController);

// AI Smart Pricing Endpoint -> POST /api/products/:id/pricing
router.post('/:id/pricing', calculateProductPricingController);

// AI Business Advisor Endpoint -> POST /api/products/:id/advisor
router.post('/:id/advisor', getBusinessAdviceForProductController);

// Marketplace Preview Endpoint -> GET /api/products/:id/marketplace-preview
router.get('/:id/marketplace-preview', getMarketplacePreviewController);

// Export Single Product -> GET /api/products/:id/export
router.get('/:id/export', exportSingleProductController);

export default router;






