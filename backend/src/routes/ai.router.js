import { Router } from 'express';
import { analyzeImageController } from '../controllers/ai.controller.js';
import { enhanceRawImageController } from '../controllers/imageEnhance.controller.js';
import { transcribeAudioController, parseVoiceFieldsController } from '../controllers/speech.controller.js';
import { generateCatalogueController } from '../controllers/catalogue.controller.js';
import { getBusinessAdviceController } from '../controllers/advisor.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all AI analysis endpoints
router.use(protect);

// Analyze uploaded image payload -> POST /api/ai/analyze-image
router.post('/analyze-image', analyzeImageController);

// Enhance uploaded image payload -> POST /api/ai/enhance-image
router.post('/enhance-image', enhanceRawImageController);

// Speech-to-text audio transcription -> POST /api/ai/speech-to-text
router.post('/speech-to-text', transcribeAudioController);

// Parse voice transcript into structured form fields -> POST /api/ai/parse-voice-fields
router.post('/parse-voice-fields', parseVoiceFieldsController);

// Multilingual AI Catalogue Generator -> POST /api/ai/generate-catalogue
router.post('/generate-catalogue', generateCatalogueController);

// AI Business Advisor -> POST /api/ai/advisor
router.post('/advisor', getBusinessAdviceController);

export default router;



