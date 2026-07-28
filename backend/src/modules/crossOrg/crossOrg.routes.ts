import { Router } from 'express';
import { CrossOrgController } from './crossOrg.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new CrossOrgController();

router.use(authMiddleware, tenantScopeMiddleware);

router.post('/', rbac('crossorg:connect'), controller.requestConnection);
router.get('/', rbac('crossorg:connect'), controller.list);
router.post('/:id/approve', rbac('crossorg:connect'), controller.approve);
router.post('/:id/reject', rbac('crossorg:connect'), controller.reject);
router.post('/:id/revoke', rbac('crossorg:connect'), controller.revoke);

export default router;
