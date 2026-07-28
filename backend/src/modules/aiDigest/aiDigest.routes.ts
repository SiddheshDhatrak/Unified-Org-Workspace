import { Router } from 'express';
import { AIDigestController } from './aiDigest.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { tenantScopeMiddleware } from '../../middleware/tenantScope.middleware';

const router = Router();
const controller = new AIDigestController();

router.use(authMiddleware, tenantScopeMiddleware);

router.get('/latest', controller.getLatest);
router.post('/generate', controller.triggerGeneration);

export default router;
