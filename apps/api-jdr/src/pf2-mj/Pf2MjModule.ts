import { Module } from '@nestjs/common'
import { FoundryRelayModule } from '../foundry/FoundryRelayModule'
import { Pf2PersistenceModule } from '../pf2-storage/Pf2PersistenceModule'
import { Pf2MjController } from './Pf2MjController'
import { Pf2MjService } from './Pf2MjService'
import { ScenarioPackageService } from './ScenarioPackageService'

@Module({ imports: [Pf2PersistenceModule, FoundryRelayModule], controllers: [Pf2MjController], providers: [Pf2MjService, ScenarioPackageService] })
export class Pf2MjModule {}
