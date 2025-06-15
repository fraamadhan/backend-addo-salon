import { z } from 'zod';

export const ItemDetailsDto = z.object({
  id: z.string().nullish(),
  price: z.number({
    required_error: 'Price field must be filled',
  }),
  quantity: z.number({
    required_error: 'Quantity field must be filled',
  }),
  name: z.string({
    required_error: 'Name field must be filled',
  }),
  brand: z.string().nullish(),
  category: z.string().nullish(),
  merchant_name: z.string().nullish(),
  tenor: z.number().nullish(),
  code_plan: z.number().nullish(),
  mid: z.number().nullish(),
  url: z.string().nullish(),
});

export type ItemDetailsType = z.infer<typeof ItemDetailsDto>;
