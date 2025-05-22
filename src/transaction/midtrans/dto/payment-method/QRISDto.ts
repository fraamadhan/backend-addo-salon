import { z } from 'zod';

export const QRISDto = z.object({
  acquirer: z.string().nullish(),
});

export type QRISType = z.infer<typeof QRISDto>;
