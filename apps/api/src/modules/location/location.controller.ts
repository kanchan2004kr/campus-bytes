import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { LocationService } from './location.service';
import { Public } from '../../common/auth/public.decorator';

@Controller()
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Public()
  @Get('hostels')
  hostels() {
    return this.service.hostels();
  }

  @Public()
  @Get('hostels/:id/rooms')
  rooms(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.rooms(id);
  }

  @Public()
  @Get('zones')
  zones() {
    return this.service.zones();
  }
}
