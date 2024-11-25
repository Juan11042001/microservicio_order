import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { envs } from './config/envs';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Servicio-de-Ordenes');
  try {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.NATS,
        options: {
          servers: envs.NAT_SERVERS,
          timeout: 5000, // 5 segundos de timeout
        },
      },
    );

    app.listen().then(() => {
      logger.log(`Servicio de Órdenes está ejecutándose en el puerto ${envs.PORT}`);
      logger.log(`Conectado a los servidores NATS: ${envs.NAT_SERVERS.join(', ')}`);
    });
  } catch (error) {
    logger.error(`Error al iniciar el Servicio de Órdenes: ${error.message}`);
    if (error.code === 'CONNECTION_REFUSED') {
      logger.error('Asegúrese de que el servidor NATS esté en ejecución y sea accesible.');
    }
  }
}

bootstrap();

