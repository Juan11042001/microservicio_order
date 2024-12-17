import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  async create(@Payload() createOrderDto: CreateOrderDto) {
    const order = await this.ordersService.create(createOrderDto);
    const paymentSession = await this.ordersService.createPaymentSession(order);
    return paymentSession;
  }

  @MessagePattern('findAllOrders')
  async findAll() {
    const orders = await this.ordersService.findAll();
    return orders;
  }

  @MessagePattern('findOneOrder')
  async findOne(@Payload() id: string) {
    const order = await this.ordersService.findOne(id);
    return order;
  }

  @MessagePattern('payOrder')
  async payOrder(@Payload() orderId: string) {
    const order = await this.ordersService.payOrder(orderId);
    return order;
  }

  @MessagePattern('cancelOrder')
  async cancelOrder(@Payload() orderId: string) {
    const order = await this.ordersService.payOrder(orderId);
    return order;
  }

  @MessagePattern('removeOrder')
  async remove(@Payload() id: string) {
    const result = await this.ordersService.remove(id);
    return result;
  }
}
