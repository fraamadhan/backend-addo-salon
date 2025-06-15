import { z } from 'zod';

// use deep partial in Customer Details
// export const AddressDto = z.object({
//     first_name: z.string().nullable().optional(),
//     last_name: z.string().nullish(),
//     phone: z.string().nullish(),
//     address: z.string().nullish(),
//     city: z.string().nullish(),
//     postal_code: z.string().nullish()
// })

export const AddressDto = z
  .object({
    first_name: z.string(),
    last_name: z.string(),
    phone: z.string(),
    address: z.string(),
    city: z.string(),
    postal_code: z.string(),
    country_code: z.string(),
  })
  .partial();

export type BillingAddressType = z.infer<typeof AddressDto>;
export type ShippingAddressType = z.infer<typeof AddressDto>;
