import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Public } from '../../common/auth/public.decorator';

/** Public student-facing discovery endpoints. Management lives under /restaurant/*. */
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly service: RestaurantsService) {}

  @Public()
  @Get()
  list() {
    return this.service.listPublic();
  }

  @Public()
  @Get('search')
  search(@Query('q') q = '') {
    return this.service.search(q);
  }

  @Public()
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getPublic(id);
  }

  @Public()
  @Get(':id/menu')
  menu(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getMenu(id);
  }
}
