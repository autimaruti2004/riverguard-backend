import { app } from './app';
import { env } from './config/env';
import { prisma, checkDatabaseConnection } from './lib/prisma';

async function startServer() {
  const isDbConnected = await checkDatabaseConnection();

  const server = app.listen(env.PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🌊 RiverGuard API Server running on port ${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Demo Mode:   ${env.DEMO_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(
      `   PostgreSQL:  ${
        isDbConnected ? 'CONNECTED' : 'DISCONNECTED (demo fallback active)'
      }`
    );
    console.log(`   Health:      http://localhost:${env.PORT}/api/v1/health`);
    console.log(`   Dashboard:   http://localhost:${env.PORT}/api/v1/dashboard`);
    console.log(`==================================================\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down RiverGuard server gracefully...`);
    server.close(async () => {
      console.log('HTTP server closed.');
      try {
        await prisma.$disconnect();
        console.log('Prisma client disconnected.');
      } catch (err) {
        console.error('Error disconnecting Prisma:', err);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('❌ Failed to start RiverGuard backend:', err);
  process.exit(1);
});
