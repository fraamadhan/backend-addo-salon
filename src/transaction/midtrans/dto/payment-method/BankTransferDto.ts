import { z } from 'zod';

const FreeTextDto = z.object({
  inquiry: z
    .array(
      z.object({
        id: z.string(),
        en: z.string(),
      }),
    )
    .optional(),
  payment: z
    .array(
      z.object({
        id: z.string(),
        en: z.string(),
      }),
    )
    .optional(),
});

export const BankTransferDto = z.object({
  bank: z.string({
    required_error: 'Nama bank harus ditentukan',
  }),
  va_number: z.string({
    required_error: 'Nomor virtual account harus disertakan',
  }),
  free_text: FreeTextDto.optional(),
  bca: z
    .object({
      sub_company_code: z.string().nullish(),
    })
    .nullish(),
  permata: z
    .object({
      recipient_name: z.string().nullish(),
    })
    .nullish(),
});

export type BankTransferType = z.infer<typeof BankTransferDto>;
