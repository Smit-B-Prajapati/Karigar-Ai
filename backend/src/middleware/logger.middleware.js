import morgan from 'morgan';
import config from '../config/env.config.js';

// Clean custom request logger format
export const requestLogger = morgan(
  config.isDev ? 'dev' : ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
);
