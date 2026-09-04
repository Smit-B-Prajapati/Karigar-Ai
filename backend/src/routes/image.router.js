import { Router } from 'express';
import { enhanceRawImageController } from '../controllers/imageEnhance.controller.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';

const router = Router();

/**
 * Main Product Photo Enhancement Endpoint
 * POST /api/image/enhance
 * Accepts multipart/form-data with field "image" OR JSON body with "image" (base64)
 */
router.post('/enhance', uploadSingleImage, enhanceRawImageController);

export default router;
