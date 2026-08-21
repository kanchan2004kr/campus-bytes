import { Body, Controller, Patch } from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
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

class ProfileDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(280) description?: string;
  @IsOptional() @IsString() @MaxLength(80) cuisine?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(60) hours?: string;
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) coverUrl?: string;
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

  @Patch('profile')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: ProfileDto) {
    // restaurantId is derived from the JWT — an owner can only edit their own.
    return this.service.updateOwnProfile(await resolveRestaurantId(this.prisma, user), dto);
  }
}
