import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'

@Module({ imports: [FoundryRelayModule, Pf2PersistenceModule], providers: [DiscordCommandsService, DiscordService], exports: [DiscordService] })
export class DiscordModule {}
