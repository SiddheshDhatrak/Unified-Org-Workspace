import { Router } from 'express';
import { PRController } from './prs.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new PRController();

router.use(authMiddleware, tenantScopeMiddleware);

// PR CRUD & Workflow
router.post('/', rbac('pr:create'), controller.create);
router.get('/', rbac('pr:create'), controller.list); // list via equivalent org permission
router.get('/:id', controller.getById);
router.patch('/:id', rbac('pr:create'), controller.update);
router.post('/:id/submit', rbac('pr:create'), controller.submit);

// Review & Merge
router.post('/:id/reviewers', rbac('pr:create'), controller.assignReviewer);
router.post('/:id/review', rbac('pr:review'), controller.review);
router.post('/:id/merge', rbac('pr:create'), controller.merge);

// Versioning (§12.5)
router.get('/:id/versions', controller.listVersions);
router.get('/:id/versions/:n/diff', controller.getDiff);
router.post('/:id/versions/:n/restore', rbac('pr:create'), controller.restore);

// Comments
router.post('/:id/comments', rbac('pr:comment'), controller.addComment);
router.get('/:id/comments', rbac('pr:comment'), controller.listComments);

// Share
router.post('/:id/share', rbac('crossorg:share'), controller.share);

export default router;
