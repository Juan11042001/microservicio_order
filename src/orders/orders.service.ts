import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const order = this.orderRepository.create({
      orderDetails: createOrderDto.orderDetails,
      totalAmount: createOrderDto.orderDetails.reduce(
        (total, detail) => total + detail.price * detail.quantity,
        0
      ),
      status: 'pending',
      paid: false
    });

    return await this.orderRepository.save(order);
  }

  async findAll() {
    return await this.orderRepository.find();
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({ where: { id } });
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

