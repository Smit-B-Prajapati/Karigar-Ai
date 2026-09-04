import app from './src/app.js';
import config from './src/config/env.config.js';
import connectDB from './src/config/db.config.js';

const PORT = config.port;

// Connect to Database & Start HTTP Server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 KarigarAI Backend Server is running!`);
    console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Auth Endpoint: http://localhost:${PORT}/api/auth`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`==================================================`);
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
    });
  });
});
