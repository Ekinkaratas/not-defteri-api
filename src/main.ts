import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import winston, { createLogger } from 'winston';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';

async function bootstrap() {
  const instance = createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    // Global format (Tüm transport'lar için varsayılan)
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),

    transports: [
      new winston.transports.Console({
        format: nestWinstonModuleUtilities.format.nestLike('NOT-DEFTERI-API', {
          colors: true,
          prettyPrint: true,
          processId: true,
        }),
        stderrLevels: ['error', 'warn'],
      }),
    ],
    handleExceptions: true,
    handleRejections: true,
  });
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      instance,
    }),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}

void bootstrap();
