import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { JWTPayload } from './types/index.js';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeSocket(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} connected`);
    }

    socket.on('join:task', (taskId: string) => {
      socket.join(`task:${taskId}`);
    });

    socket.on('leave:task', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('disconnect', () => {
      if (userId) {
        console.log(`User ${userId} disconnected`);
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
