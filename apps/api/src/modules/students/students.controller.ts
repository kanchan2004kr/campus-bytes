import { BadRequestException, Body, Controller, Get, Put } from '@nestjs/common';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import {
  UserRole,
  isValidDeliveryLocation,
  locationTypeRequiresRoom,
  type DeliveryLocationType,
} from '@campus-bytes/types';
import { PrismaService } from '../../prisma/prisma.service';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth.types';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(80)
  name?: string;

  @IsOptional() @IsUUID()
  hostelId?: string;

  @IsOptional() @IsUUID()
  roomId?: string;
}

class SaveDeliveryLocationDto {
  @IsIn(['hostel', 'gate', 'university'])
  type!: DeliveryLocationType;

  @IsString() @MaxLength(80)
  name!: string;

  @IsOptional() @IsString() @MaxLength(20)
  roomNo?: string;

  @IsOptional() @IsString() @MaxLength(200)
  instructions?: string;
}

/** Students may only read/update their OWN profile (RBAC + self-scoping). */
@Roles(UserRole.STUDENT)
@Controller('students')
export class StudentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthUser) {
    const u = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: { hostel: true, room: true },
    });
    return {
      id: u!.id,
      name: u!.name,
      email: u!.email,
      phone: u!.phone,
      studentId: u!.studentId,
      course: u!.course,
      hostelId: u!.hostelId,
      hostelName: u!.hostel?.name ?? null,
      roomId: u!.roomId,
      roomNo: u!.room?.roomNo ?? null,
      verified: u!.verified,
      // Approved campus delivery location (structured; drives Deliver-to + checkout).
      deliveryLocation: u!.savedDeliveryType
        ? {
            type: u!.savedDeliveryType as DeliveryLocationType,
            name: u!.savedDeliveryName,
            roomNo: u!.savedDeliveryRoomNo,
            instructions: u!.savedDeliveryInstructions,
          }
        : null,
    };
  }

  /** Save/replace the student's approved delivery location (backend-validated). */
  @Put('me/delivery-location')
  async saveDeliveryLocation(@CurrentUser() user: AuthUser, @Body() dto: SaveDeliveryLocationDto) {
    // Authoritative validation — reject anything not in the approved list.
    if (!isValidDeliveryLocation(dto.type, dto.name)) {
      throw new BadRequestException('Please select a valid campus delivery location.');
    }
    const roomNo = locationTypeRequiresRoom(dto.type) ? dto.roomNo?.trim() || null : null;
    if (locationTypeRequiresRoom(dto.type) && !roomNo) {
      throw new BadRequestException('Room number is required for hostel delivery.');
    }
    await this.prisma.user.update({
      where: { id: user.sub },
      data: {
        savedDeliveryType: dto.type,
        savedDeliveryName: dto.name,
        savedDeliveryRoomNo: roomNo,
        savedDeliveryInstructions: dto.instructions?.trim() || null,
      },
    });
    return this.me(user);
  }

  @Put('me')
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    await this.prisma.user.update({
      where: { id: user.sub },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.hostelId ? { hostelId: dto.hostelId } : {}),
        ...(dto.roomId ? { roomId: dto.roomId } : {}),
      },
    });
    return this.me(user);
  }
}
