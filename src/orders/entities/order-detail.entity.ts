import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './order.entity';

@Entity()
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticketTypeId: string;

  @Column()
  ticketTypeName: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @ManyToOne(() => Order, order => order.orderDetails)
  order: Order;
}

