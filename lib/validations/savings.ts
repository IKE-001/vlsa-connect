// =============================================================================
// lib/validations/savings.ts
// Owned by: Jabari (Financial Logic)
// Zod schemas for savings / contribution API request bodies.
// =============================================================================

import { z } from 'zod';

/** POST /api/savings — Treasurer logs a contribution */
export const CreateContributionSchema = z.object({
  groupId: z.string().uuid({ message: 'groupId must be a valid UUID' }),
  memberId: z.string().uuid({ message: 'memberId must be a valid UUID (GroupMember.id)' }),
  /** Amount in tambala — must be a positive integer */
  amountTambala: z
    .number()
    .int({ message: 'amountTambala must be an integer (no decimals)' })
    .positive({ message: 'amountTambala must be greater than 0' }),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'CARD']),
  /** "YYYY-MM" — which contribution cycle this covers */
  cyclePeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/, { message: 'cyclePeriod must be in YYYY-MM format' })
    .optional(),
});

export type CreateContributionInput = z.infer<typeof CreateContributionSchema>;

/** PATCH /api/savings/:id — Chairperson approves or rejects a contribution */
export const ApproveContributionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().max(500).optional(), // required if rejecting, optional otherwise
});

export type ApproveContributionInput = z.infer<typeof ApproveContributionSchema>;

export const GetSavingsQuerySchema = z.object({
  groupId: z.string().uuid(),
  memberId: z.string().uuid().optional(),
  action: z.enum(['balance', 'history']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type GetSavingsQuery = z.infer<typeof GetSavingsQuerySchema>;
