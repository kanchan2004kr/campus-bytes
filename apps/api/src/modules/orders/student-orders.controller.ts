import { Body, Controller, Get, Param, ParseUUIDPipe, Post, HttpCode } from '@nestjs/common';
import { UserRole } from '@campus-bytes/types';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/orders.dto';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

@Roles(UserRole.STUDENT)
@Controller('orders')
export class StudentOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(user, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.orders.listMine(user);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.getOne(user, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.cancel(user, id);
  }
}
