import { z } from 'zod';
import { AddressDto } from './AddressDto';

export const SellerDetailsDto = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    url: z.string(),
    address: z.array(AddressDto),
  })
  .partial();

export type SellerDetailsType = z.infer<typeof SellerDetailsDto>;
