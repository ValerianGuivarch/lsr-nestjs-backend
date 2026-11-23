import { Module } from '@nestjs/common'
import { FoundryRelayController } from './FoundryRelayController'
import { FoundryRelayService } from './FoundryRelayService'
import { FoundryItemEdits } from './FoundryItemEdits'

@Module({
  controllers: [FoundryRelayController],
  providers: [FoundryRelayService, FoundryItemEdits],
  exports: [FoundryRelayService, FoundryItemEdits]
})
export class FoundryRelayModule {}

