import { Global, Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { RestaurantCartsController } from './carts.controller';

@Global()
@Module({
  controllers: [RestaurantCartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
