import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from './shared/logger';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { rateLimitGlobal } from './middleware/rateLimit.middleware';
import { auditCaptureMiddleware } from './middleware/auditCapture.middleware';

// Routes imports
import identityRoutes from './modules/identity/identity.routes';
import organizationRoutes from './modules/organization/organization.routes';
import featureFlagRoutes from './modules/featureFlags/featureFlags.routes';
import ticketRoutes from './modules/tickets/tickets.routes';
import prRoutes from './modules/prs/prs.routes';
import crossOrgRoutes from './modules/crossOrg/crossOrg.routes';
import auditRoutes from './modules/audit/audit.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import aiDigestRoutes from './modules/aiDigest/aiDigest.routes';

const app: Express = express();

// Security Headers (§20.6) & CORS
app.use(helmet());
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(cors({ origin: env.corsOrigins, credentials: true }));

// Parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request tracking & Logging
app.use(requestIdMiddleware);
app.use(pinoHttp({ logger, autoLogging: { ignore: (req: any) => req.url?.startsWith('/health') || false } }));

// Global Rate Limiting (§19.2)
app.use(rateLimitGlobal);

// Audit Capture Seam (§14.2)
app.use(auditCaptureMiddleware);

// Health check endpoint (§20.6)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API v1 Mounts (§5.2)
const v1Router = express.Router();
v1Router.use('/auth', identityRoutes);
v1Router.use(['/orgs', '/organizations'], organizationRoutes, featureFlagRoutes);
v1Router.use('/flags', featureFlagRoutes);
v1Router.use('/tickets', ticketRoutes);
v1Router.use('/prs', prRoutes);
v1Router.use('/org-connections', crossOrgRoutes);
v1Router.use('/audit', auditRoutes);
v1Router.use('/notifications', notificationRoutes);
v1Router.use(['/digest', '/digests'], aiDigestRoutes);

app.use('/api/v1', v1Router);

// Global Error Handler (§7.1 / §20.6)
app.use(errorHandler);

export default app;
