import { Body, Controller, Get, Param, ParseUUIDPipe, Post, HttpCode } from '@nestjs/common';
import { UserRole } from '@campus-bytes/types';
import { OrdersService } from './orders.service';
import { AcceptOrderDto, AssignCartDto, RejectOrderDto } from './dto/orders.dto';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { resolveRestaurantId } from '../../common/owner';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth.types';

@Roles(UserRole.RESTAURANT)
@Controller('restaurant/orders')
export class RestaurantOrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  private rid(user: AuthUser) {
    return resolveRestaurantId(this.prisma, user);
  }

  @Get('live')
  async live(@CurrentUser() user: AuthUser) {
    return this.orders.listLive(await this.rid(user));
  }

  @Get('history')
  async history(@CurrentUser() user: AuthUser) {
    return this.orders.history(await this.rid(user));
  }

  @Get('summary')
  async summary(@CurrentUser() user: AuthUser) {
    return this.orders.restaurantSummary(await this.rid(user));
  }

  @Get('sales')
  async sales(@CurrentUser() user: AuthUser) {
    return this.orders.restaurantSales(await this.rid(user));
  }

  @Post(':id/accept')
  @HttpCode(200)
  async accept(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AcceptOrderDto) {
    return this.orders.accept(await this.rid(user), id, dto, user);
  }

  @Post(':id/reject')
  @HttpCode(200)
  async reject(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectOrderDto) {
    return this.orders.reject(await this.rid(user), id, dto, user);
  }

  @Post(':id/ready')
  @HttpCode(200)
  async ready(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.markReady(await this.rid(user), id, user);
  }

  @Post(':id/assign-cart')
  @HttpCode(200)
  async assignCart(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AssignCartDto) {
    return this.orders.assignCart(await this.rid(user), id, dto.cartId, user);
  }

  @Post(':id/delivered')
  @HttpCode(200)
  async delivered(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.markDelivered(await this.rid(user), id, user);
  }
}
