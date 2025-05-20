import { Types } from 'mongoose';
import * as crypto from 'crypto';

export const toObjectId = (id: Types.ObjectId | string) => {
  if (!id) {
    return null;
  }
  return new Types.ObjectId(id);
};

export const generateOrderCode = (fullName: string): string => {
  const names = fullName.trim().split(/\s+/);
  const initials = names
    .slice(0, 3)
    .map((n) => n[0].toUpperCase())
    .join('');
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  return `${initials}-${day}${month}${year}`;
};

export const verifySignatureKey = (
  signatureKeyMidtrans: string,
  grossAmount: string,
  orderId: string,
  statusCode: string,
  serverKey: string,
) => {
  const key = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const encryptedKey = crypto.createHash('sha512').update(key).digest('hex');

  return encryptedKey === signatureKeyMidtrans;
};
