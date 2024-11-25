import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller()
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    this.logger.log(`Recibida solicitud de creación de orden: ${JSON.stringify(createOrderDto)}`);
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll() {
    this.logger.log('Recibida solicitud para obtener todas las órdenes');
    return this.ordersService.findAll();
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: string) {
    this.logger.log(`Recibida solicitud para obtener orden con ID: ${id}`);
    return this.ordersService.findOne(id);
  }

  @MessagePattern('updateOrder')
  update(@Payload() updateOrderDto: UpdateOrderDto) {
    this.logger.log(`Recibida solicitud para actualizar orden: ${JSON.stringify(updateOrderDto)}`);
    return this.ordersService.update(updateOrderDto.id, updateOrderDto);
  }

  @MessagePattern('removeOrder')
  remove(@Payload() id: string) {
    this.logger.log(`Recibida solicitud para eliminar orden con ID: ${id}`);
    return this.ordersService.remove(id);
  }
}

