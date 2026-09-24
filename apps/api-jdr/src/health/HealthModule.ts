import { Module } from '@nestjs/common'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { HealthController } from './HealthController'

@Module({ imports: [Pf2PersistenceModule], controllers: [HealthController] })
export class HealthModule {}
