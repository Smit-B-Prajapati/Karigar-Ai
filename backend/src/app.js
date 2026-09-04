import express from 'express';
import cors from 'cors';
import path from 'path';
import { requestLogger } from './middleware/logger.middleware.js';
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import apiRouter from './routes/api.router.js';

const app = express();

// Security and utility middleware
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(requestLogger);

// Serve uploaded product images statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Mount main API routes -> /api
app.use('/api', apiRouter);

// Root greeting endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'KarigarAI Backend API',
    version: '1.0.0',
    description: 'From Handmade to Market-Ready in Minutes',
    healthCheck: '/api/health'
  });
});

// Fallback Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

