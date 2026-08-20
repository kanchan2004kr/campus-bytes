import { Body, Controller, Patch } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { UserRole } from '@campus-bytes/types';
import { RestaurantsService } from './restaurants.service';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { resolveRestaurantId } from '../../common/owner';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth.types';

class PauseDto {
  @IsBoolean()
  paused!: boolean;
}

@Roles(UserRole.RESTAURANT)
@Controller('restaurant')
export class RestaurantOwnerController {
  constructor(
    private readonly service: RestaurantsService,
    private readonly prisma: PrismaService,
  ) {}

  @Patch('status')
  async setStatus(@CurrentUser() user: AuthUser, @Body() dto: PauseDto) {
    return this.service.setPaused(await resolveRestaurantId(this.prisma, user), dto.paused);
  }
}
