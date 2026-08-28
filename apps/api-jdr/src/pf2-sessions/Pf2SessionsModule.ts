import { Module } from '@nestjs/common'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2SessionsController } from './Pf2SessionsController'

@Module({ imports: [Pf2PersistenceModule], controllers: [Pf2SessionsController] })
export class Pf2SessionsModule {}
