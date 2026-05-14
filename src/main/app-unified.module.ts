import { AppYearDiaryModule } from '../../libs/yeardiary/src/lib/backend/app-yeardiary.module'
import { GhostModule } from '../../libs/ghost/src/lib/backend/ghost.module'
import { HpModule } from '../../libs/hp/src/lib/backend/hp.module'
import { JdrModule } from '../../libs/jdr/src/lib/backend/jdr.module'
import { L7rModule } from '../../libs/l7r/src/lib/backend/l7r.module'
import configuration from '../../libs/shared/src/lib/backend/configuration'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DeviceEntity } from '../../libs/ghost/src/lib/backend/device.entity'
import { DBJdr } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr.db'
import { DBJdrStat } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-stat.db'
import { DBJdrTrait } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-trait.db'
import { DBJdrTraitModifier } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-trait-modifier.db'
import { DBJdrResource } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-resource.db'
import { DBJdrGroupResource } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-group-resource.db'
import { DBJdrItem } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-item.db'
import { DBJdrGroupItem } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-group-item.db'
import { DBJdrCharacter } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-character.db'
import { DBJdrCharacterStat } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-character-stat.db'
import { DBJdrCharacterTrait } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-character-trait.db'
import { DBJdrCharacterItem } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-character-item.db'
import { DBJdrCharacterResource } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-character-resource.db'
import { DBJdrDiceRoll } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-dice-roll.db'
import { DBJdrClass } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-class.db'
import { DBJdrClassResource } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-class-resource.db'
import { DBJdrGroup } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-group.db'
import { DBJdrDraft } from '../../libs/jdr/src/lib/backend/infrastructure/persistence/jdr-draft.db'
import { ConfigController } from './config.controller'
import { MusicController } from './music.controller'

function envEnabled(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key]

  if (raw === undefined) {
    return defaultValue
  }

  const normalized = raw.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const enableHp = envEnabled('ENABLE_HP', true)
const enableL7r = envEnabled('ENABLE_L7R', true)
const enableJdr = envEnabled('ENABLE_JDR', true)
const enableGhost = envEnabled('ENABLE_GHOST', true)
const enableYearDiary = envEnabled('ENABLE_YEARDIARY', true)

const needsPostgres = enableHp || enableL7r || enableYearDiary

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    ...(needsPostgres
      ? [
          TypeOrmModule.forRoot({
            name: 'postgres',
            type: 'postgres',
            host: configuration().postgres.host,
            port: configuration().postgres.port,
            username: configuration().postgres.username,
            password: configuration().postgres.password,
            database: configuration().postgres.database,
            autoLoadEntities: configuration().postgres.autoLoadEntities,
            synchronize: configuration().postgres.synchronize,
            poolSize: 8,
            migrationsRun: true
          })
        ]
      : []),
    ...(enableGhost
      ? [
          TypeOrmModule.forRoot({
            name: 'ghost',
            type: 'sqlite',
            database: 'ghost.sqlite',
            entities: [DeviceEntity],
            synchronize: true
          })
        ]
      : []),
    ...(enableJdr
      ? [
          TypeOrmModule.forRoot({
            name: 'jdr-sqlite',
            type: 'sqlite',
            database: 'jdr.sqlite',
            entities: [
              DBJdr,
              DBJdrStat,
              DBJdrTrait,
              DBJdrTraitModifier,
              DBJdrResource,
              DBJdrGroupResource,
              DBJdrItem,
              DBJdrGroupItem,
              DBJdrCharacter,
              DBJdrCharacterStat,
              DBJdrCharacterTrait,
              DBJdrCharacterItem,
              DBJdrCharacterResource,
              DBJdrDiceRoll,
              DBJdrClass,
              DBJdrClassResource,
              DBJdrGroup,
              DBJdrDraft
            ],
            synchronize: true
          })
        ]
      : []),
    ...(enableHp ? [HpModule] : []),
    ...(enableL7r ? [L7rModule] : []),
    ...(enableJdr ? [JdrModule] : []),
    ...(enableGhost ? [GhostModule] : []),
    ...(enableYearDiary ? [AppYearDiaryModule] : [])
  ],
  controllers: [ConfigController, MusicController]
})
export class AppUnifiedModule {}
