import { Module } from '@nestjs/common'
import { JdrModule } from './jdr.module'

@Module({
  imports: [JdrModule]
})
export class AppJdrModule {}
