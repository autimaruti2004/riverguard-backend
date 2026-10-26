import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    sendError(res, 'Validation failed', 400, 'VALIDATION_ERROR', issues);
    return;
  }

  // Prisma Known Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        sendError(res, `A record with this ${target} already exists.`, 409, 'UNIQUE_CONSTRAINT_VIOLATION');
        return;
      }
      case 'P2025':
        sendError(res, 'Record not found in database.', 404, 'RECORD_NOT_FOUND');
        return;
      case 'P2003':
        sendError(res, 'Foreign key constraint violated.', 400, 'FOREIGN_KEY_VIOLATION');
        return;
      default:
        sendError(res, `Database error: ${err.message}`, 500, `PRISMA_${err.code}`);
        return;
    }
  }

  // Prisma Connection / Initialization Error
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    sendError(
      res,
      'Database service is currently unreachable. Please check PostgreSQL connection.',
      503,
      'DATABASE_UNAVAILABLE'
    );
    return;
  }

  // Express JSON parser syntax error
  if ('status' in err && (err as any).status === 400 && 'body' in err) {
    sendError(res, 'Invalid JSON payload provided', 400, 'INVALID_JSON');
    return;
  }

  // Unhandled / Internal Server Error
  console.error('💥 Unhandled error:', err);
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred'
      : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
}
