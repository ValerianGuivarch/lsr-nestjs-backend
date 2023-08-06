import config from './config/configuration'
import { InitDatabase } from './config/evolutions/InitDatabase'
import { DBBloodlineProvider } from './data/database/bloodlines/DBBloodlineProvider'
import { DBCharacterProvider } from './data/database/character/DBCharacterProvider'
import { DBClasseProvider } from './data/database/classes/DBClasseProvider'
import { PostgresModule } from './data/database/postgres.module'
import { DBRollProvider } from './data/database/rolls/DBRollProvider'
import { DBSessionProvider } from './data/database/session/DBSessionProvider'
import { DBSkillProvider } from './data/database/skills/DBSkillProvider'
import { ArcaneService } from './domain/services/ArcaneService'
import { BloodlineService } from './domain/services/BloodlineService'
import { CharacterService } from './domain/services/CharacterService'
import { ClasseService } from './domain/services/ClasseService'
import { MjService } from './domain/services/MjService'
import { RollService } from './domain/services/RollService'
import { CharacterController } from './web/http/api/v1/characters/CharacterController'
import { RollController } from './web/http/api/v1/rolls/RollController'
import { CharacterGateway } from './web/websocket/api/v1/characters/CharacterGateway'
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
  controllers: [CharacterGateway, RollGateway, CharacterController, RollController],
  providers: [
    ArcaneService,
    BloodlineService,
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
      provide: 'IArcaneProvider',
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
