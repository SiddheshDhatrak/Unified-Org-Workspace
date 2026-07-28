import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { prisma } from './config/db';
import { redis } from './config/redis';
import { setupScheduler } from './jobs/scheduler';

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Check DB connectivity
    await prisma.$connect();
    logger.info('✅ PostgreSQL Connected successfully.');

    // Initialize Scheduler & Queues
    await setupScheduler();

    const PORT = typeof env.PORT === 'number' ? env.PORT : parseInt(String(env.PORT || 4000), 10);
    server.listen(PORT, () => {
      logger.info(`🚀 Unified Org Workspace Backend listening on port ${PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.fatal({ error }, '❌ Fatal error during server startup');
    process.exit(1);
  }
};

// Graceful Shutdown (§20.6)
const shutdown = async (signal: string) => {
  logger.info(`🛑 Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      await redis.quit();
      logger.info('Database and Cache connections closed. Clean exit.');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during disconnect');
      process.exit(1);
    }
  });

  // Force shutdown after 10s if dangling sockets remain
  setTimeout(() => {
    logger.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

export { server };
