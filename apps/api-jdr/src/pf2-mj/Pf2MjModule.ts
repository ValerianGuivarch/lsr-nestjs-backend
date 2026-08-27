import { Module } from '@nestjs/common'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'

@Module({ imports: [Pf2PersistenceModule], controllers: [Pf2MjController], providers: [Pf2MjService] })
export class Pf2MjModule {}
