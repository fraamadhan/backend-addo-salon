import { z } from 'zod';

export const RefundDto = z.object({
  refund_key: z.string().nullish(),
  amount: z.number().nullish(),
  reason: z.string().nullish(),
});

export type RefundType = z.infer<typeof RefundDto>;
