import { Router } from 'express';
import authRoutes from './auth.routes.js';
import taskRoutes from './task.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
