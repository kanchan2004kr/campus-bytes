import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  foodItemId!: string;

  @IsInt() @Min(1) @Max(50)
  quantity!: number;
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId!: string;

  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional() @IsUUID()
  deliveryZoneId?: string;

  @IsOptional() @IsUUID()
  deliveryHostelId?: string;

  @IsOptional() @IsUUID()
  deliveryRoomId?: string;

  @IsOptional() @IsString() @MaxLength(280)
  notes?: string;
}

export class AcceptOrderDto {
  @IsInt() @Min(1) @Max(120)
  prepTimeMin!: number;
}

export class RejectOrderDto {
  @IsString() @MaxLength(200)
  reason!: string;
}

export class AssignCartDto {
  @IsUUID()
  cartId!: string;
}
