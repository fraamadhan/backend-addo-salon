export enum ReservationStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  UNPAID = 'UNPAID',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  CART = 'CART',
  EXPIRED = 'EXPIRED',
}

export enum StyleType {
  MALE = 'male',
  FEMALE = 'female',
  UNISEX = 'unisex',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  GOPAY = 'gopay',
  QRIS = 'qris',
  CASH = 'cash',
}
