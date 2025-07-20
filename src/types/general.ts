export enum EmailVerificationType {
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
}

export type ProductQuery = {
  $and: Record<string, any>[];
};

export type Query = {
  $and: Record<string, any>[];
};

export type OrQuery = {
  $or: Record<string, any>[];
};

export type UserPayload = {
  _id: string;
  name: string;
  email: string;
  gender: string;
  phone_number: string;
  address: string;
  birth_date: string;
  role: string;
  is_verified: boolean;
  email_verified_at: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  iat: number;
  exp: number;
};

export interface PopulatedTransaction {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
}

export interface PopulatedItem {
  _id: string;
  reservationDate: string;
  productId: {
    _id: string;
    name: string;
  };
}
