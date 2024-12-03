import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderDetail } from './entities/order-detail.entity';
import { NATS_SERVICE } from '../config/services';
import { CreateOrderDto } from './dto/create-order.dto';
import { of } from 'rxjs';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Order>;
  let orderDetailRepository: Repository<OrderDetail>;
  let natsClientMock: any;

  beforeEach(async () => {
    natsClientMock = {
      send: jest.fn().mockReturnValue(of([
        { id: 'ticket1', name: 'Regular Ticket', price: 100, disponibility: 10 },
        { id: 'ticket2', name: 'VIP Ticket', price: 200, disponibility: 5 },
      ])),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(OrderDetail),
          useClass: Repository,
        },
        {
          provide: NATS_SERVICE,
          useValue: natsClientMock,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderDetailRepository = module.get<Repository<OrderDetail>>(getRepositoryToken(OrderDetail));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        eventId: 'event1',
        userId: 'user1',
        orderDetails: [
          { ticketTypeId: 'ticket1', quantity: 2 },
          { ticketTypeId: 'ticket2', quantity: 1 },
        ],
      };

      const savedOrder = {
        id: 'order1',
        eventId: 'event1',
        userId: 'user1',
        totalAmount: 400,
        status: 'pending',
        paid: false,
      };

      jest.spyOn(orderRepository, 'create').mockReturnValue(savedOrder as any);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(savedOrder as any);
      jest.spyOn(orderDetailRepository, 'create').mockReturnValue({} as any);
      jest.spyOn(orderDetailRepository, 'save').mockResolvedValue({} as any);
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(savedOrder as any);

      const result = await service.create(createOrderDto);

      expect(result).toEqual(savedOrder);
      expect(orderRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        eventId: 'event1',
        userId: 'user1',
        totalAmount: 400,
        status: 'pending',
        paid: false,
      }));
      expect(orderRepository.save).toHaveBeenCalled();
      expect(orderDetailRepository.create).toHaveBeenCalledTimes(2);
      expect(orderDetailRepository.save).toHaveBeenCalled();
      expect(natsClientMock.send).toHaveBeenCalledWith('findTicketTypes', { eventId: 'event1' });
      expect(natsClientMock.send).toHaveBeenCalledWith('reserveTickets', createOrderDto);
    });
  });
});

