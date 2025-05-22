import { z } from 'zod';

export const GopayDto = z.object({
  enable_callback: z.boolean().nullish().default(false),
  callback_url: z.string().nullish(),
  account_id: z.string().nullish(),
  payment_option_token: z.string().nullish(),
  pre_auth: z.boolean().default(false),
  recurring: z.boolean().default(false),
  promotion_ids: z.array(z.string()).nullish(),
});

export type GopayType = z.infer<typeof GopayDto>;
