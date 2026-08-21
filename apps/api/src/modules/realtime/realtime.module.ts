import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { loadEnv } from '../../config/env';

@Global()
@Module({
  imports: [JwtModule.register({ secret: loadEnv().jwt.accessSecret })],
  providers: [RealtimeGateway, RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
