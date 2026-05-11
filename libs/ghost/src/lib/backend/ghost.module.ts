import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeviceEntity } from './device.entity'
import { GhostService } from './ghost.service'
import { GhostController } from './ghost.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([DeviceEntity])
  ],
  controllers: [GhostController],
  providers: [GhostService],
  exports: [GhostService]
})
export class GhostModule {}
