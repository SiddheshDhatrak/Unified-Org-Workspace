import { Router } from 'express';
import { FeatureFlagController } from './featureFlags.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new FeatureFlagController();

router.use(authMiddleware, tenantScopeMiddleware);
router.get('/:id/feature-flags', controller.list);
router.patch('/:id/feature-flags/:key', rbac('org:manage'), controller.toggle);

export default router;
