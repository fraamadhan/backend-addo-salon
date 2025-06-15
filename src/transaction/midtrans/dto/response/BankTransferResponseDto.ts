import { z } from 'zod';
import { BaseMidtransResponseDto } from '.';

const VaNumberDto = z.object({
  bank: z.enum(['bca', 'bni']),
  va_number: z.string(),
});

export const BankTransferResponseDto = BaseMidtransResponseDto.extend({
  payment_type: z.literal('bank_transfer'),
  fraud_status: z.string(),
  expiry_time: z.string().optional().nullable(),
  permata_va_number: z.string().nullish(),
  va_numbers: z.array(VaNumberDto).nullish(),
  payment_amounts: z
    .array(
      z.object({
        paid_at: z.string(),
        amount: z.string(),
      }),
    )
    .optional()
    .nullable(),
});

export type BankTransferResponseType = z.infer<typeof BankTransferResponseDto>;
