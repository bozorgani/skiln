const { createClient } = require('redis');
const logger = require('../utils/logger');

let client = null;
let connectingPromise = null;
let disabled = false;

const getRedisClient = async () => {
  const url = process.env.REDIS_URL;
  if (!url || disabled) return null;

  if (client?.isOpen) return client;

  if (!client) {
    client = createClient({
      url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      },
    });

    client.on('error', (error) => {
      logger.warn(`[Redis] ${error.message}`);
    });

    client.on('ready', () => {
      logger.info('Redis connection established');
    });
  }

  if (!connectingPromise) {
    connectingPromise = client.connect().catch((error) => {
      logger.warn(`[Redis] connection failed, falling back to memory store: ${error.message}`);
      disabled = true;
      return null;
    }).finally(() => {
      connectingPromise = null;
    });
  }

  await connectingPromise;
  return client?.isOpen ? client : null;
};

const closeRedisClient = async () => {
  if (client?.isOpen) {
    await client.quit();
  }
};

module.exports = {
  getRedisClient,
  closeRedisClient,
};
