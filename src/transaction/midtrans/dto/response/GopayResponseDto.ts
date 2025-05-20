import { z } from 'zod';
import { BaseMidtransResponseDto } from '.';

const ActionDto = z.object({
  name: z.string(),
  method: z.string(),
  url: z.string(),
  fields: z.array(z.any()).optional().nullable(),
});

export const GopayResponseDto = BaseMidtransResponseDto.extend({
  payment_type: z.literal('gopay'),
  actions: z.array(ActionDto).optional().nullable(),
  channel_response_code: z.string().optional().nullable(),
  channel_response_message: z.string().optional().nullable(),
  payment_option_type: z.string().optional().nullable(),
});

export type GopayResponseType = z.infer<typeof GopayResponseDto>;
