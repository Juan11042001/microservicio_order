import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderDetailDto {
  @IsString()
  productId: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderDetailDto)
  orderDetails: OrderDetailDto[];
}

