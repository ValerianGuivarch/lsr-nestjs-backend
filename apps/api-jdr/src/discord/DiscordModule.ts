import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'

@Module({ imports: [FoundryRelayModule], providers: [DiscordCommandsService, DiscordService], exports: [DiscordService] })
export class DiscordModule {}
