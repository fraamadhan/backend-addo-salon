import { z } from 'zod';
import { PaymentMethodDto } from '../payment-method/PaymentMethodDto';
import { TransactionDetailsDto } from '../TransactionDetailsDto';
import { CustomerDetailsDto } from '../CustomerDetailsDto';
import { BankTransferDto, GopayDto, QRISDto } from '../payment-method';
import { CustomExpiryDto } from '../CustomExpiryDto';
import { ItemDetailsDto } from '../ItemDetailsDto';

export const ChargeDto = z.object({
  payment_type: PaymentMethodDto,
  transaction_details: TransactionDetailsDto,
  customer_details: CustomerDetailsDto,
  item_details: ItemDetailsDto.array(),
  custom_expiry: CustomExpiryDto.nullish(),
  gopay: GopayDto.nullish(),
  bank_transfer: BankTransferDto.nullish(),
  qris: QRISDto.nullish(),
  metadata: z.record(z.string(), z.any()).nullish(),
});

export type ChargeType = z.infer<typeof ChargeDto>;
