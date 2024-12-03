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
      // Intentar obtener información del evento con un timeout
      const eventInfo = await this.getEventInfo(createOrderDto.eventId);
      
      // Crear la orden incluso si no podemos obtener toda la información del evento
      const order = this.orderRepository.create({
        eventId: createOrderDto.eventId,
        userId: createOrderDto.userId,
        status: 'pending',
        paid: false,
        eventName: eventInfo?.name || 'Event name pending',
        eventDate: eventInfo?.startDate || new Date(),
        totalAmount: 0 // Se calculará basado en los detalles
      });

      const savedOrder = await this.orderRepository.save(order);

      // Crear los detalles de la orden
      let totalAmount = 0;
      const orderDetails = [];

      for (const detail of createOrderDto.orderDetails) {
        const orderDetail = this.orderDetailRepository.create({
          order: savedOrder,
          ticketTypeId: detail.ticketTypeId,
          quantity: detail.quantity,
          price: 0, // Precio por defecto si no podemos obtener el precio real
          ticketTypeName: 'Ticket pending confirmation'
        });

        // Intentar obtener información del tipo de ticket
        try {
          const ticketType = await firstValueFrom(
            this.client.send('findTicketType', { 
              eventId: createOrderDto.eventId,
              ticketTypeId: detail.ticketTypeId 
            }).pipe(
              timeout(5000),
              catchError(() => of(null))
            )
          );

          if (ticketType) {
            orderDetail.price = ticketType.price;
            orderDetail.ticketTypeName = ticketType.name;
            totalAmount += ticketType.price * detail.quantity;
          }
        } catch (error) {
          this.logger.warn(`Could not get ticket type information for ${detail.ticketTypeId}`);
        }

        orderDetails.push(await this.orderDetailRepository.save(orderDetail));
      }

      // Actualizar el monto total de la orden
      savedOrder.totalAmount = totalAmount;
      await this.orderRepository.save(savedOrder);

      // Intentar reservar los tickets
      try {
        await firstValueFrom(
          this.client.send('reserveTickets', createOrderDto).pipe(
            timeout(5000),
            catchError(() => of(null))
          )
        );
      } catch (error) {
        this.logger.warn('Could not reserve tickets immediately, will need manual confirmation');
      }

      return {
        ...savedOrder,
        orderDetails
      };
    } catch (error) {
      this.logger.error(`Error creating order: ${error.message}`);
      throw error;
    }
  }

  private async getEventInfo(eventId: string) {
    try {
      return await firstValueFrom(
        this.client.send('findOneEvent', eventId).pipe(
          timeout(5000),
          catchError(() => of(null))
        )
      );
    } catch (error) {
      this.logger.warn(`Could not get event information for ${eventId}`);
      return null;
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

