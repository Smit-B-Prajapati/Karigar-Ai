import { Router } from 'express';
import { register, login, logout, getMe, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// Public auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected session & profile routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

