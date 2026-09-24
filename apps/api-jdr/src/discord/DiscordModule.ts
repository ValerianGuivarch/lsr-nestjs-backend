import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjModule } from '../pf2-mj/Pf2MjModule'
import { Pf2JournalsModule } from '../pf2-journals/Pf2JournalsModule'

@Module({ imports: [FoundryRelayModule, Pf2PersistenceModule, Pf2MjModule, Pf2JournalsModule], providers: [DiscordCommandsService, DiscordService], exports: [DiscordService] })
export class DiscordModule {}
