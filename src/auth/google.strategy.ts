import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from 'src/config/google-oauth-config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(googleOauthConfig.KEY)
    client: ConfigType<typeof googleOauthConfig>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: client.clientId || '',
      clientSecret: client.clientSecret || '',
      callbackURL: client.callbackUrl || '',
      scope: client.scope || ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    if (!profile || !profile.id) {
      return done(new Error('Invalid profile data'), false);
    }
    if (!profile?.emails?.[0].verified)
      return done(new Error('Email not verified by Google'), false);

    const user = await this.authService.validateGoogleUser({
      email: profile?.emails?.[0].value || '',
      name: profile.displayName,
      password: '',
      provider: profile.provider,
      provider_id: profile.id,
    });

    if (!user) {
      return done(new Error('User not found'), false);
    }
    return done(null, user);
  }
}
