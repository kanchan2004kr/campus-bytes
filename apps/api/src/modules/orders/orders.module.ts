import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { StudentOrdersController } from './student-orders.controller';
import { RestaurantOrdersController } from './restaurant-orders.controller';

@Module({
  controllers: [StudentOrdersController, RestaurantOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
