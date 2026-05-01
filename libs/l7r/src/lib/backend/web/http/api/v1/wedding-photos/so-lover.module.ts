import { SoLoverController } from './so-lover.controller'
import { SoLoverService } from './so-lover.service'
import { Module } from '@nestjs/common'

@Module({
  controllers: [SoLoverController],
  providers: [SoLoverService]
})
export class SoLoverModule {}
