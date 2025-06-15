import { z } from 'zod';

export const CustomExpiryDto = z.object({
  order_time: z.string(),
  expiry_duration: z.number(),
  unit: z.string(),
});

export type CustomExpiryType = z.infer<typeof CustomExpiryDto>;
