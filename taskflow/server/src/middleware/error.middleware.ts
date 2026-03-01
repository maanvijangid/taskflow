import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const routeNotFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database operation failed';
  } else if (err.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  console.error('Error:', err);

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
