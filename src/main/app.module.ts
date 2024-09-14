import config from './config/configuration'
import { InitDatabase } from './config/evolutions/InitDatabase'
import { InitEntry } from './config/evolutions/InitEntry'
import { BTNNameProvider } from './data/behind/BTNNameProvider'
import { DBApotheoseProvider } from './data/database/apotheoses/DBApotheoseProvider'
import { DBBloodlineProvider } from './data/database/bloodlines/DBBloodlineProvider'
import { DBCharacterProvider } from './data/database/character/DBCharacterProvider'
import { DBClasseProvider } from './data/database/classes/DBClasseProvider'
import { PostgresModule } from './data/database/postgres.module'
import { DBRollProvider } from './data/database/rolls/DBRollProvider'
import { DBSessionProvider } from './data/database/session/DBSessionProvider'
import { DBSkillProvider } from './data/database/skills/DBSkillProvider'
import { DBConstellationProvider } from './data/elena/DBConstellationProvider'
import { DBJoueuseProvider } from './data/elena/DBJoueuseProvider'
import { DBMessageProvider } from './data/elena/DBMessageProvider'
import { DBScenarioProvider } from './data/elena/DBScenarioProvider'
import { ForestService } from './data/ForestService'
import { PokeProvider } from './data/poke/PokeProvider'
import { ApotheoseService } from './domain/services/ApotheoseService'
import { CharacterService } from './domain/services/CharacterService'
import { ClasseService } from './domain/services/ClasseService'
import { ConstellationService } from './domain/services/entities/elena/ConstellationService'
import { JoueuseService } from './domain/services/entities/elena/JoueuseService'
import { MessageService } from './domain/services/entities/elena/MessageService'
import { ScenarioService } from './domain/services/entities/elena/ScenarioService'
import { InvocationService } from './domain/services/InvocationService'
import { MjService } from './domain/services/MjService'
import { ProficiencyService } from './domain/services/ProficiencyService'
import { RollService } from './domain/services/RollService'
import { SessionService } from './domain/services/SessionService'
import { SkillService } from './domain/services/SkillService'
import { FlipImplementation } from './hp/data/flip.implementation'
import { HouseImplementation } from './hp/data/house.implementation'
import { KnowledgeImplementation } from './hp/data/knowledge.implementation'
import { SpellImplementation } from './hp/data/spell.implementation'
import { StatImplementation } from './hp/data/stat.implementation'
import { WizardImplementation } from './hp/data/wizard.implementation'
import { FlipService } from './hp/domain/services/flip.service'
import { FlipWorkflowService } from './hp/domain/services/flip.workflow-service'
import { HouseService } from './hp/domain/services/house.service'
import { KnowledgeService } from './hp/domain/services/knowledge.service'
import { SpellService } from './hp/domain/services/spell.service'
import { StatService } from './hp/domain/services/stat.service'
import { WizardService } from './hp/domain/services/wizard.service'
import { FlipController } from './hp/web/http/api/flips/flip.controller'
import { HouseController } from './hp/web/http/api/houses/houses.controller'
import { KnowledgeController } from './hp/web/http/api/knowledges/knowledges.controller'
import { SpellController } from './hp/web/http/api/spells/spells.controller'
import { StatController } from './hp/web/http/api/stats/stats.controller'
import { WizardController } from './hp/web/http/api/wizards/wizard.controller'
import { FlipGateway } from './hp/web/http/websocket/api/flips/FlipGateway'
import { CharacterController } from './web/http/api/v1/characters/CharacterController'
import { ConstellationController } from './web/http/api/v1/elena/ConstellationController'
import { JoueuseController } from './web/http/api/v1/elena/JoueuseController'
import { MessageController } from './web/http/api/v1/elena/MessageController'
import { ScenarioController } from './web/http/api/v1/elena/ScenarioController'
import { MjController } from './web/http/api/v1/mj/MjController'
import { RollController } from './web/http/api/v1/rolls/RollController'
import { CharacterGateway } from './web/websocket/api/v1/characters/CharacterGateway'
import { MjGateway } from './web/websocket/api/v1/mj/MjGateway'
import { RollGateway } from './web/websocket/api/v1/rolls/RollGateway'
import { SpeakingGateway } from './web/websocket/api/v1/speaking/SpeakingGateway'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    TypeOrmModule.forRoot({
      name: 'postgres',
      type: 'postgres',
      // eslint-disable-next-line no-process-env
      host: config().postgres.host,
      // eslint-disable-next-line no-process-env,no-magic-numbers
      port: config().postgres.port,
      // eslint-disable-next-line no-process-env
      username: config().postgres.username,
      // eslint-disable-next-line no-process-env
      password: config().postgres.password,
      database: config().postgres.database,
      autoLoadEntities: config().postgres.autoLoadEntities,
      synchronize: config().postgres.synchronize,
      poolSize: 8,
      migrationsRun: true // Exécute automatiquement les évolutions au démarrage de l'application
    }),
    PostgresModule
  ],
  controllers: [
    MjGateway,
    CharacterGateway,
    RollGateway,
    FlipGateway,
    SpeakingGateway,
    MjController,
    CharacterController,
    RollController,
    JoueuseController,
    ScenarioController,
    ConstellationController,
    MessageController,
    WizardController,
    KnowledgeController,
    HouseController,
    SpellController,
    StatController,
    FlipController
  ],
  providers: [
    SkillService,
    ProficiencyService,
    ApotheoseService,
    SessionService,
    InvocationService,
    CharacterService,
    ClasseService,
    RollService,
    ConstellationService,
    MessageService,
    JoueuseService,
    ScenarioService,
    MjService,
    JwtService,
    WizardService,
    StatService,
    KnowledgeService,
    HouseService,
    FlipWorkflowService,
    SpellService,
    InitDatabase,
    InitEntry,
    //    CharacterGateway,
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
    },
    {
      provide: 'FlipService',
      useClass: FlipService
    },
    FlipService,
    {
      provide: 'WizardService',
      useClass: WizardService
    },
    {
      provide: 'IApotheoseProvider',
      useClass: DBApotheoseProvider
    },
    {
      provide: 'ISkillProvider',
      useClass: DBSkillProvider
    },
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
    },
    {
      provide: 'IPokeProvider',
      useClass: PokeProvider
    },
    {
      provide: 'ISessionProvider',
      useClass: DBSessionProvider
    },
    {
      provide: 'INameProvider',
      useClass: BTNNameProvider
    },
    {
      provide: 'IBloodlineProvider',
      useClass: DBBloodlineProvider
    },
    {
      provide: 'IClasseProvider',
      useClass: DBClasseProvider
    },
    {
      provide: 'IScenarioProvider',
      useClass: DBScenarioProvider
    },
    {
      provide: 'IConstellationProvider',
      useClass: DBConstellationProvider
    },
    {
      provide: 'IJoueuseProvider',
      useClass: DBJoueuseProvider
    },
    {
      provide: 'IMessageProvider',
      useClass: DBMessageProvider
    },
    {
      provide: 'IWizardProvider',
      useClass: WizardImplementation
    },
    {
      provide: 'IKnowledgeProvider',
      useClass: KnowledgeImplementation
    },
    {
      provide: 'IFlipProvider',
      useClass: FlipImplementation
    },
    {
      provide: 'IHouseProvider',
      useClass: HouseImplementation
    },
    {
      provide: 'IStatProvider',
      useClass: StatImplementation
    },
    {
      provide: 'IFlipProvider',
      useClass: FlipImplementation
    },
    {
      provide: 'ISpellProvider',
      useClass: SpellImplementation
    },
    {
      provide: 'IHouseProvider',
      useClass: HouseImplementation
    },
    ForestService
  ]
})
export class AppModule {}
