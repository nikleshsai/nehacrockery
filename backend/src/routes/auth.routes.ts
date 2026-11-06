// ─────────────────────────────────────────────────────────────────────────────
// Auth routes: /api/v1/auth
// (Login is performed against Supabase Auth directly by the admin client.)
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
