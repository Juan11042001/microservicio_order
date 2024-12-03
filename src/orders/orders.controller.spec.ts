import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              id: 'order1',
              eventId: 'event1',
              userId: 'user1',
              totalAmount: 400,
              status: 'pending',
              paid: false,
            }),
            findAll: jest.fn().mockResolvedValue([
              {
                id: 'order1',
                eventId: 'event1',
                userId: 'user1',
                totalAmount: 400,
                status: 'pending',
                paid: false,
              },
            ]),
            findOne: jest.fn().mockResolvedValue({
              id: 'order1',
              eventId: 'event1',
              userId: 'user1',
              totalAmount: 400,
              status: 'pending',
              paid: false,
            }),
            update: jest.fn().mockResolvedValue({
              id: 'order1',
              eventId: 'event1',
              userId: 'user1',
              totalAmount: 400,
              status: 'completed',
              paid: true,
            }),
            remove: jest.fn().mockResolvedValue({ id: 'order1' }),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

      expect(await controller.create(createOrderDto)).toEqual({
        id: 'order1',
        eventId: 'event1',
        userId: 'user1',
        totalAmount: 400,
        status: 'pending',
        paid: false,
      });
      expect(service.create).toHaveBeenCalledWith(createOrderDto);
    });
  });

  // Añadir más pruebas para findAll, findOne, update y remove
});

