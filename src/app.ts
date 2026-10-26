import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import { sendError } from './utils/response';

export function createApp(): Application {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use(requestLogger);

  // Mount API v1 router
  app.use('/api/v1', apiRoutes);

  // 404 Handler for unmatched endpoints
  app.use((req: Request, res: Response) => {
    sendError(res, `Route ${req.method} ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
