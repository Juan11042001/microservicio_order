import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsString()
  id: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  paid?: boolean;
}

