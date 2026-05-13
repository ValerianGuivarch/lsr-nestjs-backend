import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DBJdr } from '../jdr.db'
import { DBJdrStat } from '../jdr-stat.db'
import { DBJdrTrait } from '../jdr-trait.db'
import { DBJdrTraitModifier } from '../jdr-trait-modifier.db'
import { DBJdrResource } from '../jdr-resource.db'
import { DBJdrGroupResource } from '../jdr-group-resource.db'
import { DBJdrItem } from '../jdr-item.db'
import { DBJdrGroupItem } from '../jdr-group-item.db'
import { DBJdrCharacter } from '../jdr-character.db'
import { DBJdrCharacterStat } from '../jdr-character-stat.db'
import { DBJdrCharacterTrait } from '../jdr-character-trait.db'
import { DBJdrCharacterItem } from '../jdr-character-item.db'
import { DBJdrCharacterResource } from '../jdr-character-resource.db'
import { DBJdrDiceRoll } from '../jdr-dice-roll.db'
import { DBJdrClass } from '../jdr-class.db'
import { DBJdrClassResource } from '../jdr-class-resource.db'
import { DBJdrGroup } from '../jdr-group.db'
import { DBJdrDraft } from '../jdr-draft.db'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
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
      'jdr-sqlite'
    )
  ],
  exports: [TypeOrmModule]
})
export class JdrSqliteModule {}
