import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjModule } from '../pf2-mj/Pf2MjModule'

@Module({ imports: [FoundryRelayModule, Pf2PersistenceModule, Pf2MjModule], providers: [DiscordCommandsService, DiscordService], exports: [DiscordService] })
export class DiscordModule {}
