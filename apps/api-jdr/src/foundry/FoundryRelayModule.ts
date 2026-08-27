import { Module } from '@nestjs/common'
import { FoundryRelayController } from './FoundryRelayController'
import { FoundryRelayService } from './FoundryRelayService'

@Module({
  controllers: [FoundryRelayController],
  providers: [FoundryRelayService],
  exports: [FoundryRelayService]
})
export class FoundryRelayModule {}

