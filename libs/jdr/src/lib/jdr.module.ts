import { Module } from '@nestjs/common'
import { JdrService } from './domain/jdr/JdrService'
import { JdrImplementation } from './data/jdr/JdrProvider'
import { JdrController } from './app/jdr/JdrController'
import { JdrSqliteModule } from './data/database/jdr-sqlite.module'
import { TraitService } from './domain/traits/TraitService'
import { TraitProvider } from './data/traits/TraitProvider'
import { TraitController } from './app/traits/TraitController'
import { StatService } from './domain/stats/StatService'
import { StatProvider } from './data/stats/StatProvider'
import { StatController } from './app/stats/StatController'
import { ResourceService } from './domain/resources/ResourceService'
import { ResourceProvider } from './data/resources/ResourceProvider'
import { ResourceController } from './app/resources/ResourceController'
import { ItemService } from './domain/items/ItemService'
import { ItemProvider } from './data/items/ItemProvider'
import { ItemController } from './app/items/ItemController'
import { ClassService } from './domain/classes/ClassService'
import { ClassProvider } from './data/classes/ClassProvider'
import { ClassController } from './app/classes/ClassController'
import { GroupService } from './domain/groups/GroupService'
import { GroupProvider } from './data/groups/GroupProvider'
import { GroupController } from './app/groups/GroupController'
import { CharacterService } from './domain/characters/CharacterService'
import { CharacterProvider } from './data/characters/CharacterProvider'
import { CharacterController } from './app/characters/CharacterController'
import { RollService } from './domain/rolls/RollService'
import { RollProvider } from './data/rolls/RollProvider'
import { RollController } from './app/rolls/RollController'

// Single module for the whole lib - one controller per data type, no module-per-slice fragmentation.
@Module({
  imports: [JdrSqliteModule],
  controllers: [
    JdrController,
    TraitController,
    StatController,
    ResourceController,
    ItemController,
    ClassController,
    GroupController,
    CharacterController,
    RollController
  ],
  providers: [
    JdrService,
    { provide: 'IJdrProvider', useClass: JdrImplementation },
    TraitService,
    { provide: 'ITraitProvider', useClass: TraitProvider },
    StatService,
    { provide: 'IStatProvider', useClass: StatProvider },
    ResourceService,
    { provide: 'IResourceProvider', useClass: ResourceProvider },
    ItemService,
    { provide: 'IItemProvider', useClass: ItemProvider },
    ClassService,
    { provide: 'IClassProvider', useClass: ClassProvider },
    GroupService,
    { provide: 'IGroupProvider', useClass: GroupProvider },
    CharacterService,
    { provide: 'ICharacterProvider', useClass: CharacterProvider },
    RollService,
    { provide: 'IRollProvider', useClass: RollProvider }
  ],
  exports: [JdrService]
})
export class JdrModule {}
