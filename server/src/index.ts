import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { env, isDevelopment } from './config/env.js';
import { connectDB } from './config/db.js';
import { routeNotFound, errorHandler } from './middleware/error.middleware.js';
import routes from './routes/index.js';
import { initializeSocket } from './socket.js';

const app = express();
const httpServer = createServer(app);

// 👉 ADD THIS LINE: Tell Express to trust Render's load balancer
app.set('trust proxy', 1);

// Initialize Socket.IO
initializeSocket(httpServer);

// Middleware
app.use(cors({
  origin: env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (isDevelopment) {
  app.use(morgan('dev'));
}

// Routes
app.use('/api', routes);

// Error handling
app.use(routeNotFound);
app.use(errorHandler);

// Start server
async function startServer(): Promise<void> {
  try {
    await connectDB();
    
    httpServer.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});