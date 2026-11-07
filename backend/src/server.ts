// ─────────────────────────────────────────────────────────────────────────────
// Server entry point — starts HTTP server with graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
import { config } from './config/env';
import { logger } from './utils/logger';
import prisma from './config/database';
import app from './app';

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
let isShuttingDown = false;

async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  // Force exit after 10 seconds if connections hang
  const forceExitTimer = setTimeout(() => {
    logger.error('Could not close connections in time, forcing shutdown');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (err) {
      logger.error('Error disconnecting from database', err);
    }
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  });
}

process.on('SIGTERM', () => void gracefulShutdown('SIGTERM', 0));
process.on('SIGINT', () => void gracefulShutdown('SIGINT', 0));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  void gracefulShutdown('uncaughtException', 1);
});
