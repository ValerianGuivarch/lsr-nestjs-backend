import { Module } from '@nestjs/common'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2JournalsController } from './Pf2JournalsController'
import { Pf2JournalsService } from './Pf2JournalsService'

@Module({ imports: [Pf2PersistenceModule], controllers: [Pf2JournalsController], providers: [Pf2JournalsService], exports: [Pf2JournalsService] })
export class Pf2JournalsModule {}
