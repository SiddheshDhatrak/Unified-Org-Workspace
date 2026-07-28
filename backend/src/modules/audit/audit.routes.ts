import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { rateLimitHeavy } from '../../middleware/rateLimit.middleware';

const router = Router();
const controller = new AuditController();

router.use(authMiddleware, tenantScopeMiddleware);

router.get('/', rbac('audit:read'), controller.list);
router.get('/export', rateLimitHeavy, rbac('audit:export'), controller.export);

export default router;
