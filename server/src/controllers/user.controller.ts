import { Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../types/index.js';

export const getUsers = async (_: AuthRequest, res: Response): Promise<void> => {
  const users = await prisma.user.findMany();

  res.json({
    success: true,
    data: users,
  });
};

export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.length < 2) {
    res.json({
      success: true,
      data: { users: [] },
    });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      email: true,
      name: true,
      profilePic: true,
    },
    take: 10,
  });

  res.json({
    success: true,
    data: { users },
  });
};

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { unreadOnly } = req.query;

  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
      ...(unreadOnly === 'true' && { isRead: false }),
    },
    include: {
      sender: { select: { id: true, name: true, profilePic: true } },
      task: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { receiverId: userId, isRead: false },
  });

  res.json({
    success: true,
    data: { notifications, unreadCount },
  });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { id } = req.params;

  if (id === 'all') {
    await prisma.notification.updateMany({
      where: { receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
    return;
  }

  const notification = await prisma.notification.findFirst({
    where: { id, receiverId: userId },
  });

  if (!notification) {
    res.status(404).json({
      success: false,
      error: 'Notification not found',
    });
    return;
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { name, profilePic } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(profilePic && { profilePic }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      profilePic: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    message: 'Profile updated',
    data: { user },
  });
};
