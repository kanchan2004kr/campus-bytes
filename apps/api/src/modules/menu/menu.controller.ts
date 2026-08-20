import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { UserRole } from '@campus-bytes/types';
import { MenuService } from './menu.service';
import { AvailabilityDto, UpsertCategoryDto, UpsertItemDto } from './dto/menu.dto';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { resolveRestaurantId } from '../../common/owner';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth.types';

@Roles(UserRole.RESTAURANT)
@Controller('restaurant/menu')
export class MenuController {
  constructor(
    private readonly service: MenuService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getMenu(@CurrentUser() user: AuthUser) {
    return this.service.getOwnMenu(await resolveRestaurantId(this.prisma, user));
  }

  @Post('categories')
  async createCategory(@CurrentUser() user: AuthUser, @Body() dto: UpsertCategoryDto) {
    return this.service.createCategory(await resolveRestaurantId(this.prisma, user), dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteCategory(await resolveRestaurantId(this.prisma, user), id);
  }

  @Post('items')
  async createItem(@CurrentUser() user: AuthUser, @Body() dto: UpsertItemDto) {
    return this.service.createItem(await resolveRestaurantId(this.prisma, user), dto);
  }

  @Put('items/:id')
  async updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertItemDto,
  ) {
    return this.service.updateItem(await resolveRestaurantId(this.prisma, user), id, dto);
  }

  @Delete('items/:id')
  async deleteItem(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.deleteItem(await resolveRestaurantId(this.prisma, user), id);
  }

  @Patch('items/:id/availability')
  async setAvailability(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AvailabilityDto,
  ) {
    return this.service.setAvailability(await resolveRestaurantId(this.prisma, user), id, dto);
  }
}
