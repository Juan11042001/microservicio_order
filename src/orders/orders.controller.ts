import { Controller, Res } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TicketsService } from './tickets.service';
import { Response } from 'express';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ticketsService: TicketsService
  ) {}

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

  @MessagePattern('findOrdersByUser')
  async findOrdersByUser(@Payload() userId: string) {
    
    const orders = await this.ordersService.findByUser(userId);
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

  @MessagePattern('generateTickets')
  async generateTickets(@Res() res: Response, @Payload() orderId : string) {
    const pdfDoc = await this.ticketsService.generateTickets(orderId);

    return new Promise((resolve, reject) => {
      const chunks = [];
      
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      pdfDoc.end();
    });
  } 
}
