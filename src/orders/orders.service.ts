import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { NATS_SERVICE } from '../config/services';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const ticketTypes = await firstValueFrom(
      this.client.send('validateTicketTypes', createOrderDto.orderDetails),
    );

    const totalAmount = createOrderDto.orderDetails.reduce(
      (acc, ticketType) => {
        const price = ticketTypes.find(
          (item) => item.id === ticketType.ticketTypeId,
        ).price;
        const priceCalculated = price * ticketType.quantity;
        return acc + priceCalculated;
      },
      0,
    );

    const order = this.orderRepository.create({
      userId: createOrderDto.userId,
      totalAmount,
      orderDetails: ticketTypes.map((ticketType) => ({
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        price: ticketType.price,
        quantity: createOrderDto.orderDetails.find(
          (item) => item.ticketTypeId === ticketType.id,
        ).quantity,
      })),
    });
    return await this.orderRepository.save(order);
  }

  async createPaymentSession(order: Order) {
    try {
      return await firstValueFrom(
        this.client.send('createPaymentSession', {
          orderId: order.id,
          currency: 'usd',
          items: order.orderDetails.map((item) => ({
            name: item.ticketTypeName,
            quantity: item.quantity.toString(),
            price: item.price,
          })),
        }),
      );
    } catch (error) {
      console.log(error);
    }
  }

  async findAll() {
    return await this.orderRepository.find({
      relations: ['orderDetails'],
    });
  }

  async findByUser(userId: string) {
    const orders = await this.orderRepository.find({
      where: { userId, paid: true },
      relations: {
        orderDetails: true,
      },
    });
    const returnedOrders = await Promise.all(
      orders.map(async (order) => {
        const ticketType = await firstValueFrom(
          this.client.send(
            'findOneTicketType',
            order.orderDetails[0].ticketTypeId,
          ),
        );
        return { ...order, ticketType };
      }) 
    )
    // orders.forEach(async (order) => {
    //   const ticketType = await firstValueFrom(
    //     this.client.send(
    //       'findOneTicketType',
    //       order.orderDetails[0].ticketTypeId,
    //     ),
    //   );
    //   console.log(ticketType);

    //   return { ...order, ticketType };
    // });
    return returnedOrders;
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderDetails'],
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async payOrder(id: string) {
    const order = await this.findOne(id);
    order.status = 'completed';
    order.paid = true;
    return await this.orderRepository.save(order);
  }

  async cancelOrder(id: string) {
    const order = await this.findOne(id);
    order.status = 'canceled';
    return await this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { id };
  }
}
