import { z } from 'zod';

export const PaymentMethodDto = z.enum(['qris', 'gopay', 'bank_transfer']);

export type PaymentMethodType = z.infer<typeof PaymentMethodDto>;
