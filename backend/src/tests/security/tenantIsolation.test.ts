import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../../shared/errors/AppError';
import { errorHandler } from '../../middleware/errorHandler.middleware';

describe('Security & Tenant Isolation Suite (BOLA / IDOR Resistance - §21.4 & §26.3)', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Mock tenant scoping router simulating cross-tenant access attempt
    app.get('/api/v1/tickets/:id', (req: Request, res: Response, next: NextFunction) => {
      const callerOrgId = req.headers['x-org-id'];
      const targetTicketOrgId = 'org-globex-uuid-999'; // Ticket belongs to Globex

      // Tenant isolation seam check
      if (callerOrgId !== targetTicketOrgId) {
        // MUST return 404 Not Found to prevent leaking resource existence (§8.1 / §26.3)
        return next(new NotFoundError('Resource not found in tenant'));
      }
      res.status(200).json({ data: { id: req.params.id, title: 'Confidential Ticket' } });
    });

    app.use(errorHandler);
  });

  test('Cross-tenant IDOR / BOLA attempt strictly yields 404 Not Found (NEVER 403)', async () => {
    const response = await request(app)
      .get('/api/v1/tickets/secret-ticket-id')
      .set('x-org-id', 'org-acme-uuid-111'); // Acme user trying to access Globex resource

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).not.toContain('Globex'); // No leakage
  });

  test('Same-tenant request succeeds cleanly', async () => {
    const response = await request(app)
      .get('/api/v1/tickets/secret-ticket-id')
      .set('x-org-id', 'org-globex-uuid-999');

    expect(response.status).toBe(200);
    expect(response.body.data.title).toBe('Confidential Ticket');
  });
});
