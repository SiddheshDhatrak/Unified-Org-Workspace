import { Router } from 'express';
import { IdentityController } from './identity.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rateLimitLogin } from '../../middleware/rateLimit.middleware';

const router = Router();
const controller = new IdentityController();

router.post('/register', controller.register);
router.post('/login', rateLimitLogin, controller.login);
router.post('/refresh', controller.refresh);

// Protected routes
router.post('/logout', authMiddleware, controller.logout);
router.post('/logout-all', authMiddleware, controller.logoutAll);
router.post('/switch-org', authMiddleware, controller.switchOrg);
router.get('/me', authMiddleware, tenantScopeMiddleware, controller.getMe);

export default router;
