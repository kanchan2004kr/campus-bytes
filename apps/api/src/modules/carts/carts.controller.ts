import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@campus-bytes/types';
import { CartsService } from './carts.service';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

/** Restaurant read access to carts for the handover workflow (READ ONLY). */
@Roles(UserRole.RESTAURANT)
@Controller('restaurant/carts')
export class RestaurantCartsController {
  constructor(private readonly carts: CartsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.carts.list(user.campusId);
  }
}
