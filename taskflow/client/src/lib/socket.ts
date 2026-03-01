import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function initSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  const url = import.meta.env.VITE_API_URL || window.location.origin;

  socket = io(url, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinTaskRoom(taskId: string): void {
  socket?.emit('join:task', taskId);
}

export function leaveTaskRoom(taskId: string): void {
  socket?.emit('leave:task', taskId);
}
