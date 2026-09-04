import { Router } from 'express';
import { exportAllProductsController } from '../controllers/marketplace.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all export endpoints
router.use(protect);

// Export all products -> GET /api/marketplace/export?format=json|csv
router.get('/export', exportAllProductsController);

export default router;
