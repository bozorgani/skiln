require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { closeRedisClient } = require('./src/config/redis');

const PORT = process.env.PORT || 5000;
let server;

const logger = require('./src/utils/logger');

const startServer = async () => {
  try {
    await connectDB();
    server = http.createServer(app).listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  try {
    await closeRedisClient();
  } catch (error) {
    logger.warn('Failed to close Redis connection:', error.message);
  }

  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();

