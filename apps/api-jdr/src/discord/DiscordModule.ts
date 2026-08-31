import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'

@Module({ providers: [DiscordCommandsService, DiscordService], exports: [DiscordService] })
export class DiscordModule {}
