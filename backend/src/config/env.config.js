import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/karigar_ai',
  jwtSecret: process.env.JWT_SECRET || 'default_karigar_jwt_secret_key_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
  imageEnhanceApiKey: process.env.IMAGE_ENHANCE_API_KEY || '',
  removeBgApiKey: process.env.REMOVE_BG_API_KEY || '',
  clipdropApiKey: process.env.CLIPDROP_API_KEY || '',
};

export default config;


