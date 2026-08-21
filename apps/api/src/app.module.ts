import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { OtpThrottlerGuard } from './common/otp-throttler.guard';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { CartsModule } from './modules/carts/carts.module';
import { LocationModule } from './modules/location/location.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { StudentsModule } from './modules/students/students.module';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { RolesGuard } from './common/auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    TenantModule,
    MailModule,
    AuditModule,
    RealtimeModule,
    CartsModule,
    LocationModule,
    AuthModule,
    RestaurantsModule,
    OrdersModule,
    StudentsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: OtpThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
