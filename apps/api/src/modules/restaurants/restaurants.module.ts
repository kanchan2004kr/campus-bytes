import { Module } from '@nestjs/common';
import { RestaurantsController } from './restaurants.controller';
import { RestaurantOwnerController } from './restaurant-owner.controller';
import { RestaurantsService } from './restaurants.service';
import { MenuController } from '../menu/menu.controller';
import { MenuService } from '../menu/menu.service';

@Module({
  controllers: [RestaurantsController, RestaurantOwnerController, MenuController],
  providers: [RestaurantsService, MenuService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
