import config from './config/configuration'
import { InitDatabase } from './config/evolutions/InitDatabase'
import { BTNNameProvider } from './data/behind/BTNNameProvider'
import { DBApotheoseProvider } from './data/database/apotheoses/DBApotheoseProvider'
import { DBBloodlineProvider } from './data/database/bloodlines/DBBloodlineProvider'
import { DBCharacterProvider } from './data/database/character/DBCharacterProvider'
import { DBClasseProvider } from './data/database/classes/DBClasseProvider'
import { PostgresModule } from './data/database/postgres.module'
import { DBRollProvider } from './data/database/rolls/DBRollProvider'
import { DBSessionProvider } from './data/database/session/DBSessionProvider'
import { DBSkillProvider } from './data/database/skills/DBSkillProvider'
import { ApotheoseService } from './domain/services/ApotheoseService'
import { CharacterService } from './domain/services/CharacterService'
import { ClasseService } from './domain/services/ClasseService'
import { InvocationService } from './domain/services/InvocationService'
import { MjService } from './domain/services/MjService'
import { ProficiencyService } from './domain/services/ProficiencyService'
import { RollService } from './domain/services/RollService'
import { SessionService } from './domain/services/SessionService'
import { SkillService } from './domain/services/SkillService'
import { CharacterController } from './web/http/api/v1/characters/CharacterController'
import { MjController } from './web/http/api/v1/mj/MjController'
import { RollController } from './web/http/api/v1/rolls/RollController'
import { CharacterGateway } from './web/websocket/api/v1/characters/CharacterGateway'
import { MjGateway } from './web/websocket/api/v1/mj/MjGateway'
import { RollGateway } from './web/websocket/api/v1/rolls/RollGateway'
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
      migrationsRun: true // Exécute automatiquement les évolutions au démarrage de l'application
    }),
    PostgresModule
  ],
  controllers: [MjGateway, CharacterGateway, RollGateway, MjController, CharacterController, RollController],
  providers: [
    SkillService,
    ProficiencyService,
    ApotheoseService,
    SessionService,
    InvocationService,
    CharacterService,
    ClasseService,
    RollService,
    MjService,
    JwtService,
    InitDatabase,
    //    CharacterGateway,
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
    }
  ]
})
export class AppModule {}
