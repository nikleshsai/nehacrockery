// ─────────────────────────────────────────────────────────────────────────────
// Server entry point — starts HTTP server with graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
import { config } from './config/env';
import { logger } from './utils/logger';
import prisma, { ensureDatabaseSchema } from './config/database';
import app from './app';

ensureDatabaseSchema().catch((err) => {
  logger.warn('Initial schema check failed:', err);
});

const server = app.listen(config.port, () => {
  logger.info(`
  ╔══════════════════════════════════════════════════════════╗
  ║     Neha Crockery House — Backend API Server             ║
  ╠══════════════════════════════════════════════════════════╣
  ║  Environment : ${config.nodeEnv.padEnd(40)} ║
  ║  Port        : ${String(config.port).padEnd(40)} ║
  ║  API Base    : http://localhost:${config.port}/api/v1${' '.repeat(21 - String(config.port).length)}║
  ╚══════════════════════════════════════════════════════════╝
  `);
});

// ── Graceful shutdown ──────────────────────────────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error disconnecting from database', err);
    }
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  gracefulShutdown('uncaughtException');
});
