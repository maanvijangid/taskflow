import { Router } from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  getUsers,
  searchUsers,
  getNotifications,
  markNotificationRead,
  updateProfile,
} from '../controllers/user.controller.js';

const router = Router();

router.use(protectRoute);

router.get('/', getUsers);
router.get('/search', searchUsers);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/profile', updateProfile);

export default router;
