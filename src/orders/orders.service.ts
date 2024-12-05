import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { NATS_SERVICE } from '../config/services';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetail)
    private readonly orderDetailRepository: Repository<OrderDetail>,
    @Inject(NATS_SERVICE) private client: ClientProxy
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    try {
      const ticketTypes = await this.getTicketTypes(createOrderDto.orderDetails.map(detail => detail.ticketTypeId));
      
      let totalAmount = 0;
      const orderDetails = createOrderDto.orderDetails.map(detail => {
        const ticketType = ticketTypes.find(tt => tt.id === detail.ticketTypeId);
        if (!ticketType) {
          throw new Error(`Ticket type ${detail.ticketTypeId} not found`);
        }
        totalAmount += ticketType.price * detail.quantity;
        return {
          ticketTypeId: detail.ticketTypeId,
          quantity: detail.quantity,
          price: ticketType.price,
          ticketTypeName: ticketType.name
        };
      });

      const order = this.orderRepository.create({
        userId: createOrderDto.userId,
        totalAmount,
        status: 'pending',
        paid: false,
        orderDetails
      });

      const savedOrder = await this.orderRepository.save(order);

      await this.reserveTickets(createOrderDto);

      return savedOrder;
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      throw error;
    }
  }

  async createPaymentSession(order: Order) {
    try {
      return await firstValueFrom(
        this.client.send('create.payment.session', {
          orderId: order.id,
          currency: 'usd',
          items: order.orderDetails.map(item => ({
            name: item.ticketTypeName,
            price: item.price,
            quantity: item.quantity,
          })),
        }).pipe(
          timeout(5000),
          catchError(() => {
            this.logger.warn('Could not create payment session, using default values');
            return of({ url: 'https://example.com/payment' });
          })
        )
      );
    } catch (error) {
      this.logger.warn(`Could not create payment session: ${error.message}`);
      return { url: 'https://example.com/payment' };
    }
  }

  private async getTicketTypes(ticketTypeIds: string[]) {
    try {
      return await firstValueFrom(
        this.client.send('findTicketTypes', ticketTypeIds).pipe(
          timeout(5000),
          catchError(() => {
            this.logger.warn('Could not get ticket types, using default values');
            return of(ticketTypeIds.map(id => ({ id, name: 'Unknown', price: 0 })));
          })
        )
      );
    } catch (error) {
      this.logger.warn(`Could not get ticket types: ${error.message}`);
      return ticketTypeIds.map(id => ({ id, name: 'Unknown', price: 0 }));
    }
  }

  private async reserveTickets(createOrderDto: CreateOrderDto) {
    try {
      await firstValueFrom(
        this.client.send('reserveTickets', createOrderDto).pipe(
          timeout(5000),
          catchError(() => {
            this.logger.warn('Could not reserve tickets immediately, will need manual confirmation');
            return of(null);
          })
        )
      );
    } catch (error) {
      this.logger.warn('Could not reserve tickets immediately, will need manual confirmation');
    }
  }


  async findAll() {
    return await this.orderRepository.find({
      relations: ['orderDetails']
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['orderDetails']
    });
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
    return { id };
  }
}

