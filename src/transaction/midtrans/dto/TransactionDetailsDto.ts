import { z } from 'zod';

export const TransactionDetailsDto = z.object({
  order_id: z.string(),
  gross_amount: z.number(),
});

export type TransactionDetailsType = z.infer<typeof TransactionDetailsDto>;
