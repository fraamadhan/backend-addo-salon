import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import Logger from './logger';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule, { abortOnError: false });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const whitelist = (process.env.CORS_ORIGIN_OPTIONS ?? '').split(',');
  // console.log(whitelist);
  const corsOptions = {
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow: boolean) => void,
    ) {
      if (!origin || origin === undefined) {
        logger.errorString(`this origin: ${origin} undefined`);
        return callback(null, true);
      }
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.errorString(`blocked cors for ${origin}`);
        // console.log('blocked cors for:', origin);
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  };

  app.enableCors(corsOptions);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Error starting the application:', err);
  process.exit(1);
});
