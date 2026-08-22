import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CartStatus, RestaurantStatus, UserRole } from '@campus-bytes/types';
import { AdminService } from './admin.service';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

class RejectDto {
  @IsString() @MinLength(3) @MaxLength(200)
  reason!: string;
}
class CartStatusDto {
  @IsEnum(CartStatus)
  status!: CartStatus;
}
class CreateCartDto {
  @IsString() @MinLength(2) @MaxLength(40)
  label!: string;
}
class BroadcastDto {
  @IsString() @MaxLength(40)
  audience!: string;
  @IsString() @MinLength(3) @MaxLength(280)
  message!: string;
}
class CreateRestaurantDto {
  @IsString() @MinLength(2) @MaxLength(80)
  name!: string;
  @IsEmail()
  ownerEmail!: string;
  @IsOptional() @IsString() @MaxLength(80)
  ownerName?: string;
  @IsString() @MinLength(8) @MaxLength(72)
  password!: string;
  @IsOptional() @IsString() @MaxLength(280)
  description?: string;
  @IsOptional() @IsString() @MaxLength(80)
  cuisine?: string;
  @IsOptional() @IsString() @MaxLength(40)
  phone?: string;
  @IsOptional() @IsString() @MaxLength(60)
  hours?: string;
}
class UpdateRestaurantDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(280) description?: string;
  @IsOptional() @IsString() @MaxLength(80) cuisine?: string;
  @IsOptional() @IsString() @MaxLength(40) phone?: string;
  @IsOptional() @IsString() @MaxLength(60) hours?: string;
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) coverUrl?: string;
  @IsOptional() @IsInt() @Min(1) prepTimeMin?: number;
  @IsOptional() @IsBoolean() deliveryAvailable?: boolean;
  @IsOptional() @IsBoolean() isPaused?: boolean;
  @IsOptional() @IsNumber() @Min(0) @Max(5) avgRating?: number;
  // Owner account fields — updated on the linked owner user (if any).
  @IsOptional() @IsString() @MaxLength(80) ownerName?: string;
  @IsOptional() @IsEmail() ownerEmail?: string;
}
class ResetRestaurantPwDto {
  @IsString() @MinLength(8) @MaxLength(72)
  password!: string;
}
class CreateOwnerDto {
  @IsEmail()
  ownerEmail!: string;
  @IsOptional() @IsString() @MaxLength(80)
  ownerName?: string;
  @IsString() @MinLength(8) @MaxLength(72)
  password!: string;
}
class OwnerStatusDto {
  @IsBoolean()
  active!: boolean;
}
class ImportApprovedStudentsDto {
  // Raw CSV text: "studentId,studentName" per line (header row optional).
  @IsString() @MinLength(1) @MaxLength(2_000_000)
  csv!: string;
}

/** All endpoints require ADMIN. RBAC enforced by RolesGuard, self-scoped to campus. */
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview(@CurrentUser() u: AuthUser) {
    return this.admin.overview(u.campusId);
  }

  @Get('analytics/restaurants')
  perf(@CurrentUser() u: AuthUser) {
    return this.admin.restaurantPerformance(u.campusId);
  }

  @Get('restaurants')
  restaurants(@CurrentUser() u: AuthUser, @Query('status') status?: RestaurantStatus) {
    return this.admin.listRestaurants(u.campusId, status);
  }

  @Get('restaurants/:id')
  restaurantDetail(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.restaurantDetail(u.campusId, id);
  }

  @Get('approved-students/count')
  approvedStudentsCount(@CurrentUser() u: AuthUser) {
    return this.admin.approvedStudentsCount(u.campusId);
  }

  @Get('approved-students')
  approvedStudents(
    @CurrentUser() u: AuthUser,
    @Query('query') query?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.admin.approvedStudents(u.campusId, query, limit ? Number(limit) : 50, offset ? Number(offset) : 0);
  }

  @Post('approved-students/import')
  @HttpCode(200)
  importApprovedStudents(@CurrentUser() u: AuthUser, @Body() dto: ImportApprovedStudentsDto) {
    return this.admin.importApprovedStudents(u, dto.csv);
  }

  @Post('restaurants')
  @HttpCode(200)
  createRestaurant(@CurrentUser() u: AuthUser, @Body() dto: CreateRestaurantDto) {
    return this.admin.createRestaurant(u, dto);
  }

  @Post('restaurants/:id/create-owner')
  @HttpCode(200)
  createRestaurantOwner(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateOwnerDto,
  ) {
    return this.admin.createRestaurantOwner(u, id, dto);
  }

  @Patch('restaurants/:id')
  updateRestaurant(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.admin.updateRestaurant(u, id, dto);
  }

  @Post('restaurants/:id/reset-password')
  @HttpCode(200)
  resetRestaurantPw(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetRestaurantPwDto,
  ) {
    return this.admin.resetRestaurantPassword(u, id, dto.password);
  }

  @Patch('restaurants/:id/owner-status')
  setOwnerStatus(
    @CurrentUser() u: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OwnerStatusDto,
  ) {
    return this.admin.setRestaurantOwnerStatus(u, id, dto.active);
  }

  @Post('restaurants/:id/approve')
  @HttpCode(200)
  approve(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.approveRestaurant(u, id);
  }

  @Post('restaurants/:id/reject')
  @HttpCode(200)
  reject(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectDto) {
    return this.admin.rejectRestaurant(u, id, dto.reason);
  }

  @Patch('restaurants/:id/suspend')
  suspend(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setRestaurantStatus(u, id, RestaurantStatus.SUSPENDED);
  }

  @Patch('restaurants/:id/reactivate')
  reactivate(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setRestaurantStatus(u, id, RestaurantStatus.APPROVED);
  }

  @Get('students')
  students(@CurrentUser() u: AuthUser) {
    return this.admin.listStudents(u.campusId);
  }

  @Patch('students/:id/block')
  block(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setStudentBlocked(u, id, true);
  }

  @Patch('students/:id/unblock')
  unblock(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setStudentBlocked(u, id, false);
  }

  @Get('carts')
  carts(@CurrentUser() u: AuthUser) {
    return this.admin.listCarts(u.campusId);
  }

  @Post('carts')
  createCart(@CurrentUser() u: AuthUser, @Body() dto: CreateCartDto) {
    return this.admin.createCart(u, dto.label);
  }

  @Patch('carts/:id/status')
  cartStatus(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CartStatusDto) {
    return this.admin.setCartStatus(u, id, dto.status);
  }

  @Get('orders/live')
  liveOrders(@CurrentUser() u: AuthUser) {
    return this.admin.liveOrders(u.campusId);
  }

  @Get('payments')
  payments(@CurrentUser() u: AuthUser) {
    return this.admin.payments(u.campusId);
  }

  @Get('support/tickets')
  tickets(@CurrentUser() u: AuthUser) {
    return this.admin.tickets(u.campusId);
  }

  @Patch('support/tickets/:id/resolve')
  resolveTicket(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.resolveTicket(u, id);
  }

  @Post('notifications/broadcast')
  @HttpCode(200)
  broadcast(@CurrentUser() u: AuthUser, @Body() dto: BroadcastDto) {
    return this.admin.broadcast(u, dto.audience, dto.message);
  }

  @Get('audit-logs')
  audit(@CurrentUser() u: AuthUser) {
    return this.admin.auditLog(u.campusId);
  }
}
