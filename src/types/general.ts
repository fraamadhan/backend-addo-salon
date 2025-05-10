export enum EmailVerificationType {
  REGISTER = 'register',
  FORGOT_PASSWORD = 'forgot-password',
}

export type ProductQuery = {
  $and: Record<string, any>[];
};
