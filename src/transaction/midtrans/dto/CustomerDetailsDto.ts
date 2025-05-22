import { z } from 'zod';
import { AddressDto } from './AddressDto';

export const CustomerDetailsDto = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    email: z.string(),
    phone: z.string(),
    billing_address: z.array(AddressDto),
    shipping_address: z.array(AddressDto),
  })
  .partial();

export type CustomerDetailsType = z.infer<typeof CustomerDetailsDto>;
