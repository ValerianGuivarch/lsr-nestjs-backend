import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrStat } from '../stats/database/jdr-stat.db'
import { DBJdrTrait } from '../traits/database/DBJdrTrait'
import { DBJdrTraitModifier } from '../traits/database/DBJdrTraitModifier'
import { DBJdrResource } from '../resources/database/jdr-resource.db'
import { DBJdrGroupResource } from '../resources/database/jdr-group-resource.db'
import { DBJdrItem } from '../items/database/jdr-item.db'
import { DBJdrItemModifier } from '../items/database/jdr-item-modifier.db'
import { DBJdrGroupItem } from '../items/database/jdr-group-item.db'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { DBJdrCharacterStat } from '../characters/database/jdr-character-stat.db'
import { DBJdrCharacterTrait } from '../characters/database/jdr-character-trait.db'
import { DBJdrCharacterItem } from '../characters/database/jdr-character-item.db'
import { DBJdrCharacterResource } from '../characters/database/jdr-character-resource.db'
import { DBJdrCharacterGroup } from '../characters/database/jdr-character-group.db'
import { DBJdrDiceRoll } from '../rolls/database/jdr-dice-roll.db'
import { DBJdrClass } from '../classes/database/jdr-class.db'
import { DBJdrGroup } from '../groups/database/jdr-group.db'
import { DBJdrPlayer } from '../players/database/jdr-player.db'

const jdrEntities = [
  DBJdr,
  DBJdrStat,
  DBJdrTrait,
  DBJdrTraitModifier,
  DBJdrResource,
  DBJdrGroupResource,
  DBJdrItem,
  DBJdrItemModifier,
  DBJdrGroupItem,
  DBJdrCharacter,
  DBJdrCharacterStat,
  DBJdrCharacterTrait,
  DBJdrCharacterItem,
  DBJdrCharacterResource,
  DBJdrCharacterGroup,
  DBJdrDiceRoll,
  DBJdrClass,
  DBJdrGroup,
  DBJdrPlayer
]

@Module({
  imports: [
    // eslint-disable-next-line no-process-env
    TypeOrmModule.forRoot({
      name: 'jdr-sqlite',
      type: 'sqlite',
      // eslint-disable-next-line no-process-env
      database: process.env['JDR_SQLITE_DATABASE'] || 'jdr-database.sqlite',
      entities: jdrEntities,
      synchronize: true
    }),
    TypeOrmModule.forFeature(jdrEntities, 'jdr-sqlite')
  ],
  exports: [TypeOrmModule]
})
export class JdrSqliteModule {}
