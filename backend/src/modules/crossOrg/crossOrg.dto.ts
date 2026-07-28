import { z } from 'zod';

export const requestConnectionSchema = z.object({
  partnerOrgSlug: z.string().min(1, 'Partner organization slug is required'),
}).strict();
