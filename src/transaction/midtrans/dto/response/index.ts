import { z } from 'zod';
import { GopayResponseDto } from './GopayResponseDto';
import { BankTransferResponseDto } from './BankTransferResponseDto';
import { QRISResponseDto } from './QRISResponseDto';

const ActionDto = z.object({
  name: z.string(),
  method: z.string(),
  url: z.string(),
  fields: z.array(z.any()).optional().nullable(),
});

const VaNumberDto = z.object({
  bank: z.enum(['bca', 'bni', 'bri']),
  va_number: z.string(),
});

export const BaseMidtransResponseDto = z.object({
  status_code: z.string(),
  status_message: z.string(),
  transaction_id: z.string(),
  order_id: z.string(),
  gross_amount: z.string().optional().nullable(),
  payment_type: z.string(),
  transaction_time: z.string(),
  transaction_status: z.string(),
  signature_key: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  merchant_id: z.string().optional().nullable(),
  fraud_status: z.string().optional().nullable(),
  acquirer: z.string().optional().nullable(),
  issuer: z.string().optional().nullable(),
  settlement_time: z.string().optional().nullable(),
  transaction_type: z.string().optional().nullable(),
  shopeepay_reference_number: z.string().optional().nullable(),
  reference_id: z.string().optional().nullable(),
  actions: z.array(ActionDto).optional().nullable(),
  channel_response_code: z.string().optional().nullable(),
  channel_response_message: z.string().optional().nullable(),
  payment_option_type: z.string().optional().nullable(),
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

export const MidtransChargeResponseDto = z.discriminatedUnion('payment_type', [
  BankTransferResponseDto,
  GopayResponseDto,
  QRISResponseDto,
]);

export type MidtransChargeResponseType = z.infer<
  typeof MidtransChargeResponseDto
>;
