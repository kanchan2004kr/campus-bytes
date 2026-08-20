import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { UserRole } from '@campus-bytes/types';
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
    };
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
