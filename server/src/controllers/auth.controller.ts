import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { createToken, setTokenCookie, clearTokenCookie } from '../utils/jwt.js';
import { RegisterInput, LoginInput, GoogleLoginInput } from '../schemas/auth.schema.js';
import { AuthRequest } from '../types/index.js';
import { NotificationType } from '@prisma/client';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

/**
 * Register a new user with email and password
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, name, password } = req.body as RegisterInput;

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    res.status(400).json({
      success: false,
      error: 'User with this email already exists',
    });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      profilePic: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Link any tasks that were assigned to this email before registration
  await linkPendingTasks(user.email, user.id);

  const token = createToken({ userId: user.id, email: user.email });
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user },
  });
};

/**
 * Login with email and password
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.password) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
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

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401).json({
      success: false,
      error: 'Invalid email or password',
    });
    return;
  }

  const token = createToken({ userId: user.id, email: user.email });
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePic: user.profilePic,
        isActive: user.isActive,
      },
    },
  });
};

/**
 * Login/Register with Google OAuth
 */
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body as GoogleLoginInput;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).json({
        success: false,
        error: 'Invalid Google token',
      });
      return;
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, profilePic: picture || user.profilePic },
        });
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Account is deactivated. Contact administrator.',
        });
        return;
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          googleId,
          profilePic: picture,
          isActive: true, // New users are active by default
        },
      });

      // Link any tasks that were assigned to this email before registration
      await linkPendingTasks(user.email, user.id);
    }

    const token = createToken({ userId: user.id, email: user.email });
    setTokenCookie(res, token);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePic: user.profilePic,
          isActive: user.isActive,
        },
      },
    });
  } catch (error: any) {
    console.error('Google login error:', error?.message);
    res.status(401).json({
      success: false,
      error: `Google authentication failed: ${error?.message || 'Unknown error'}`,
    });
  }
};

/**
 * Logout and clear session
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  clearTokenCookie(res);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * Get current authenticated user
 */
export const getMe = async ({ user }: AuthRequest, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: { user },
  });
};

/**
 * Internal helper to link tasks assigned by email to a user ID
 */
async function linkPendingTasks(email: string, userId: string): Promise<void> {
  const pendingTasks = await prisma.task.findMany({
    where: {
      assigneeEmail: email.toLowerCase(),
      assigneeId: null,
    },
  });

  if (pendingTasks.length > 0) {
    await prisma.task.updateMany({
      where: {
        assigneeEmail: email.toLowerCase(),
        assigneeId: null,
      },
      data: { assigneeId: userId },
    });

    // Create notifications for newly linked tasks
    await prisma.notification.createMany({
      data: pendingTasks.map((task) => ({
        type: NotificationType.ASSIGNMENT,
        text: `You have been assigned to task: ${task.title}`,
        receiverId: userId,
        senderId: task.userId,
        taskId: task.id,
      })),
    });
  }
}