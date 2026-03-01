import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { env, isProduction } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

export function createToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function setTokenCookie(res: Response, token: string): void {
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    // 👉 CHANGED 'strict' to 'none' here:
    sameSite: isProduction ? 'none' : 'lax', 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

export function clearTokenCookie(res: Response): void {
  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    // 👉 CHANGED 'strict' to 'none' here:
    sameSite: isProduction ? 'none' : 'lax', 
    maxAge: 0,
  });
}