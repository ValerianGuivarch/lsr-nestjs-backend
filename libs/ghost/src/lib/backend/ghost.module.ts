import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ToolStateEntity } from './device.entity'
import { GameStateEntity } from './game-state.entity'
import { GhostService } from './ghost.service'
import { GhostController } from './ghost.controller'
import { GhostAudioGateway } from './ghost-audio.gateway'

@Module({
  imports: [
    TypeOrmModule.forFeature([ToolStateEntity, GameStateEntity], 'ghost')
  ],
  controllers: [GhostController],
  providers: [GhostService, GhostAudioGateway],
  exports: [GhostService]
})
export class GhostModule {}
