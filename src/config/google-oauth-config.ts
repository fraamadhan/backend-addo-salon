import { registerAs } from '@nestjs/config';

export default registerAs('googleOAuth', () => ({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
  callbackUrl: process.env.GOOGLE_OAUTH_CALLBACK_URL || '',
  scope: process.env.GOOGLE_OAUTH_SCOPE?.split(' ') || ['email', 'profile'],
}));
