// ─────────────────────────────────────────────────────────────────────────────
// Auth routes: /api/v1/auth
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/auth.validator';

const router = Router();

router.get('/config', authController.authConfig);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
