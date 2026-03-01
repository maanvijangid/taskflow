import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
} from '../schemas/auth.schema.js';
import {
  register,
  login,
  googleLogin,
  logout,
  getMe,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/google-login', validate(googleLoginSchema), googleLogin);
router.post('/logout', logout);
router.get('/me', protectRoute, getMe);

export default router;
