import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderDetail]),
    NatsModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

