import { z } from 'zod';
import { BaseMidtransResponseDto } from '.';

const QRISActionDto = z.object({
  name: z.string(),
  method: z.string(),
  url: z.string(),
});

export const QRISResponseDto = BaseMidtransResponseDto.extend({
  payment_type: z.literal('qris'),
  merchant_id: z.string().optional().nullable(),
  fraud_status: z.string().optional().nullable(),
  acquirer: z.string().optional().nullable(),
  issuer: z.string().optional().nullable(),
  settlement_time: z.string().optional().nullable(),
  transaction_type: z.string().optional().nullable(),
  shopeepay_reference_number: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  actions: z.array(QRISActionDto).optional().nullable(),
});

export type QrisResponseType = z.infer<typeof QRISResponseDto>;
