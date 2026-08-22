import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import { createApp } from './app.js';
import type { Server } from 'http';

const app = createApp();

const server: Server = app.listen(env.port, () => {
  console.log(`GlobeTrotter API listening on http://localhost:${env.port} [${env.nodeEnv}]`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
