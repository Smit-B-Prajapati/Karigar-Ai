import { Router } from 'express';
import healthRouter from './health.router.js';
import authRouter from './auth.router.js';
import productRouter from './product.router.js';
import aiRouter from './ai.router.js';
import pricingRouter from './pricing.router.js';
import marketplaceRouter from './marketplace.router.js';

import imageRouter from './image.router.js';

const router = Router();

// Mount Health Check route -> /api/health
router.use('/health', healthRouter);

// Mount Auth routes -> /api/auth
router.use('/auth', authRouter);

// Mount Product CRUD routes -> /api/products
router.use('/products', productRouter);

// Mount Image Enhancement route -> /api/image/enhance
router.use('/image', imageRouter);

// Mount AI Services routes -> /api/ai
router.use('/ai', aiRouter);

// Mount Smart Pricing routes -> /api/pricing
router.use('/pricing', pricingRouter);

// Mount Marketplace & Export routes -> /api/marketplace
router.use('/marketplace', marketplaceRouter);

export default router;



