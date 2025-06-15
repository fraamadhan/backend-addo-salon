import { z } from 'zod';

export const CreateGopayAccountDto = z.object({
  payment_type: z.enum(['gopay']),
  gopay_partner: z
    .object({
      phone_number: z.string(),
      country_code: z.string(),
      redirect_url: z.string().nullish(),
    })
    .nullish(),
});

export type GopayAccountType = z.infer<typeof CreateGopayAccountDto>;
