import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envs } from './config/envs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Orders-Service');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.NAT_SERVERS,
      },
    },
  );
  await app.listen();
  logger.log('Orders-Service is running');
}
bootstrap();

