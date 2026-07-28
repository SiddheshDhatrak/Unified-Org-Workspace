import { PrismaClient } from '@prisma/client';

const softDeletableModels = [
  'User',
  'Organization',
  'Ticket',
  'PullRequest',
  'TicketComment',
  'PRComment',
] as const;

type SoftDeletableModel = typeof softDeletableModels[number];

const isSoftDeletable = (model?: string): model is SoftDeletableModel => {
  return model !== undefined && softDeletableModels.includes(model as SoftDeletableModel);
};

// Base client for break-glass or direct migration/seeding execution
export const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Extended Prisma Client enforcing automatic deletedAt: null filtering (§9.4)
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async findMany({ model, args, query }) {
        if (isSoftDeletable(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (isSoftDeletable(model)) {
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (isSoftDeletable(model)) {
          args = args || {};
          args.where = { deletedAt: null, ...args.where };
        }
        return query(args);
      },
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;
