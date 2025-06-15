import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MidtransService } from './midtrans.service';
@Module({
  imports: [
    ConfigModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const mode = config.get<string>('MIDTRANS_MODE');
        const sandboxURL = config.get<string>('MIDTRANS_BASE_URL_SANDBOX');
        const productionURL = config.get<string>(
          'MIDTRANS_BASE_URL_PRODUCTION',
        );

        const baseURL = mode === 'sandbox' ? sandboxURL : productionURL;

        if (!baseURL) throw new Error('BaseURL Midtrans tidak terdefinisi!');

        return {
          timeout: config.get('HTTP_TIMEOUT') ?? 10000,
          maxRedirects: config.get('MAX_REDIRECTS') ?? 5,
          baseURL,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Basic ${Buffer.from(`${config.get('MIDTRANS_SERVER_KEY')}:`).toString('base64')}`,
          },
        };
      },
    }),
  ],
  exports: [HttpModule],
  providers: [MidtransService],
})
export class MidtransModule {}
