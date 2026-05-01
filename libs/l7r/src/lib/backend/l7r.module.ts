import { InitDatabase } from './config/evolutions/InitDatabase'
import { InitEntry } from './config/evolutions/InitEntry'
import {
  ApotheoseService,
  CharacterService,
  ClasseService,
  ConstellationService,
  InvocationService,
  JoueuseService,
  MessageService,
  MjService,
  ProficiencyService,
  RollService,
  ScenarioService,
  SessionService,
  SkillService,
  SoLoverService,
  WeddingPhotosService
} from './application/services'
import {
  BTNNameProvider,
  DBApotheoseProvider,
  DBBloodlineProvider,
  DBCharacterProvider,
  DBClasseProvider,
  DBConstellationProvider,
  DBJoueuseProvider,
  DBMessageProvider,
  DBRollProvider,
  DBScenarioProvider,
  DBSessionProvider,
  DBSkillProvider,
  PokeProvider
} from './infrastructure/persistence'
import {
  CharacterController,
  ConstellationController,
  JoueuseController,
  MessageController,
  MjController,
  RollController,
  ScenarioController,
  SoLoverController,
  WeddingPhotosController
} from './infrastructure/http'
import { PostgresModule } from './infrastructure/persistence/database/postgres.module'
import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

@Module({
  imports: [PostgresModule],
  controllers: [
    MjController,
    CharacterController,
    RollController,
    JoueuseController,
    ScenarioController,
    ConstellationController,
    MessageController,
    WeddingPhotosController,
    SoLoverController
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
    InitDatabase,
    InitEntry,
    WeddingPhotosService,
    SoLoverService,
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
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
    }
  ]
})
export class L7rModule {}