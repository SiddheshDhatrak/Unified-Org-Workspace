import { TicketService } from '../../modules/tickets/tickets.service';
import { InvalidStateTransitionError } from '../../shared/errors/AppError';
import { TicketStatus } from '@prisma/client';

describe('Domain Workflow State Machines (§10.1 / §11.2)', () => {
  const service = new TicketService();

  test('Ticket State Machine: allows valid sequential transitions', () => {
    // Testing validation method directly
    expect(() => (service as any).validateStateTransition(TicketStatus.OPEN, TicketStatus.IN_PROGRESS)).not.toThrow();
    expect(() => (service as any).validateStateTransition(TicketStatus.IN_PROGRESS, TicketStatus.BLOCKED)).not.toThrow();
    expect(() => (service as any).validateStateTransition(TicketStatus.BLOCKED, TicketStatus.IN_PROGRESS)).not.toThrow();
    expect(() => (service as any).validateStateTransition(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED)).not.toThrow();
    expect(() => (service as any).validateStateTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED)).not.toThrow();
  });

  test('Ticket State Machine: rejects illegal jumps and transitions from terminal states', () => {
    expect(() => (service as any).validateStateTransition(TicketStatus.OPEN, TicketStatus.RESOLVED))
      .toThrow(InvalidStateTransitionError);

    expect(() => (service as any).validateStateTransition(TicketStatus.CLOSED, TicketStatus.OPEN))
      .toThrow(InvalidStateTransitionError);
  });
});
