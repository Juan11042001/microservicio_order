import { Column, Entity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: false })
  paid: boolean;

  @OneToMany(() => OrderDetail, (orderDetail) => orderDetail.order, {
    cascade: true,
    eager: true
  })
  orderDetails: OrderDetail[];
}

@Entity('order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Order, (order) => order.orderDetails)
  order: Order;
}

