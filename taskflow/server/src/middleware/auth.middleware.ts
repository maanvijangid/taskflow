import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { AuthRequest, JWTPayload } from '../types/index.js';

export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized - No token provided',
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profilePic: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account is deactivated. Contact administrator.',
      });
      return;
    }

    req.user = user as AuthRequest['user'];
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};
