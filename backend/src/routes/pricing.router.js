import { Router } from 'express';
import { analyzePricingController, calculateSmartPricingController } from '../controllers/pricing.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all pricing calculation endpoints
router.use(protect);

// Main Dynamic Pricing Assistant Analysis Endpoint -> POST /api/pricing/analyze
router.post('/analyze', analyzePricingController);

// Legacy calculation endpoint alias -> POST /api/pricing/calculate
router.post('/calculate', calculateSmartPricingController);

export default router;

