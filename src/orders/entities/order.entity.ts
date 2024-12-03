import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { OrderDetail } from './order-detail.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  eventId: string;

  @Column()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  status: string;

  @Column()
  paid: boolean;

  @Column()
  eventName: string;

  @Column()
  eventDate: Date;

  @OneToMany(() => OrderDetail, orderDetail => orderDetail.order, { cascade: true })
  orderDetails: OrderDetail[];
}

