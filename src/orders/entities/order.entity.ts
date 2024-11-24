export class Order {
  id: string;

  totalAmount: number;

  status: string; //pendiente ,cancelado,completado

  orderDetails: OrderDetail[];
}


export class OrderDetail {
  id: string;
  ticketTypeId: string;
  quantity: number;
}