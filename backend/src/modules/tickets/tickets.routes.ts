import { Router } from 'express';
import { TicketController } from './tickets.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';
import { rbac } from '../../middleware/rbac.middleware';

const router = Router();
const controller = new TicketController();

router.use(authMiddleware, tenantScopeMiddleware);

// Ticket CRUD
router.post('/', rbac('ticket:create'), controller.create);
router.get('/', rbac('ticket:read'), controller.list);
router.get('/:id', rbac('ticket:read'), controller.getById);
router.patch('/:id', rbac('ticket:update'), controller.update);
router.delete('/:id', rbac('ticket:delete'), controller.delete);
router.patch('/:id/assign', rbac('ticket:update'), controller.assign);

// Comments
router.post('/:id/comments', rbac('ticket:comment'), controller.addComment);
router.get('/:id/comments', rbac('ticket:read'), controller.listComments);

// Attachments
router.post('/:id/attachments', rbac('ticket:update'), controller.uploadAttachment);
router.get('/:id/attachments/:attId', rbac('ticket:read'), controller.getAttachmentUrl);

// Cross-org Sharing
router.post('/:id/share', rbac('crossorg:share'), controller.share);
router.delete('/:id/share/:shareId', rbac('crossorg:share'), controller.revokeShare);

export default router;
