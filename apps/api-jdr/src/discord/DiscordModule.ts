import { Module } from '@nestjs/common'
import { DiscordCommandsService } from './DiscordCommandsService'
import { DiscordService } from './DiscordService'
import { Pf2RequestService } from './Pf2RequestService'
import { Pf2RequestController } from './Pf2RequestController'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjModule } from '../pf2-mj/Pf2MjModule'
import { Pf2JournalsModule } from '../pf2-journals/Pf2JournalsModule'

@Module({ imports: [FoundryRelayModule, Pf2PersistenceModule, Pf2MjModule, Pf2JournalsModule], controllers: [Pf2RequestController], providers: [DiscordCommandsService, DiscordService, Pf2RequestService], exports: [DiscordService, Pf2RequestService] })
export class DiscordModule {}
