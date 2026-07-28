import { Router } from 'express';
import { OrganizationController } from './organization.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new OrganizationController();

// All organization routes require authenticated session & valid active membership in that org
router.use(authMiddleware, tenantScopeMiddleware);

router.get('/:id', controller.getDetail);
router.patch('/:id', rbac('org:manage'), controller.updateSettings);
router.post('/:id/archive', rbac('org:manage'), controller.archive);
router.post('/:id/restore', rbac('org:manage'), controller.restore);
router.delete('/:id', rbac('org:manage'), controller.delete);

// Member management
router.get('/:id/members', rbac('org:manage'), controller.listMembers);
router.post('/:id/invitations', rbac('org:manage'), controller.invite);
router.post('/:id/members/invite', rbac('org:manage'), controller.invite);
router.patch('/:id/members/:membershipId', rbac('org:manage'), controller.updateMember);
router.delete('/:id/members/:membershipId', rbac('org:manage'), controller.removeMember);

export default router;
