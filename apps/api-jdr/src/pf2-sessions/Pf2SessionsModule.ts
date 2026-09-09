import { Module } from '@nestjs/common'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2SessionsController } from './Pf2SessionsController'
import { Pf2WikiSessionsController } from './Pf2WikiSessionsController'
import { DiscordModule } from '../discord/DiscordModule'

@Module({
  imports: [Pf2PersistenceModule, DiscordModule],
  controllers: [Pf2SessionsController, Pf2WikiSessionsController],
})
export class Pf2SessionsModule {}
