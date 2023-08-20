import { DBApotheose } from './apotheoses/DBApotheose'
import { DBApotheoseProvider } from './apotheoses/DBApotheoseProvider'
import { DBBloodlineApotheose } from './apotheoses/DBBloodlineApotheose'
import { DBCharacterApotheose } from './apotheoses/DBCharacterApotheose'
import { DBClasseApotheose } from './apotheoses/DBClasseApotheose'
import { DBBloodline } from './bloodlines/DBBloodline'
import { DBBloodlineProvider } from './bloodlines/DBBloodlineProvider'
import { DBCharacter } from './character/DBCharacter'
import { DBCharacterProvider } from './character/DBCharacterProvider'
import { DBCharacterTemplate } from './character/DBCharacterTemplate'
import { DBClasse } from './classes/DBClasse'
import { DBClasseProvider } from './classes/DBClasseProvider'
import { DBBloodlineProficiency } from './proficiencies/DBBloodlineProficiency'
import { DBCharacterProficiency } from './proficiencies/DBCharacterProficiency'
import { DBClasseProficiency } from './proficiencies/DBClasseProficiency'
import { DBProficiency } from './proficiencies/DBProficiency'
import { DBProficiencyProvider } from './proficiencies/DBProficiencyProvider'
import { DBRoll } from './rolls/DBRoll'
import { DBRollProvider } from './rolls/DBRollProvider'
import { DBSession } from './session/DBSession'
import { DBSessionProvider } from './session/DBSessionProvider'
import { DBBloodlineSkill } from './skills/DBBloodlineSkill'
import { DBCharacterSkill } from './skills/DBCharacterSkill'
import { DBCharacterTemplateSkill } from './skills/DBCharacterTemplateSkill'
import { DBClasseSkill } from './skills/DBClasseSkill'
import { DBSkill } from './skills/DBSkill'
import { DBSkillProvider } from './skills/DBSkillProvider'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        DBApotheose,
        DBClasseApotheose,
        DBBloodlineApotheose,
        DBCharacterApotheose,
        DBCharacterTemplateSkill,
        DBRoll,
        DBSession,
        DBCharacter,
        DBCharacterTemplate,
        DBBloodline,
        DBClasse,
        DBSkill,
        DBCharacterSkill,
        DBBloodlineSkill,
        DBClasseSkill,
        DBProficiency,
        DBClasseProficiency,
        DBBloodlineProficiency,
        DBCharacterProficiency
      ],
      'postgres'
    )
  ],
  providers: [
    {
      provide: 'IRollProvider',
      useClass: DBRollProvider
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
      provide: 'ISessionProvider',
      useClass: DBSessionProvider
    },
    {
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
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
      provide: 'IProficiencyProvider',
      useClass: DBProficiencyProvider
    }
  ],
  exports: [
    TypeOrmModule,
    {
      provide: 'ISkillProvider',
      useClass: DBSkillProvider
    },
    {
      provide: 'IApotheoseProvider',
      useClass: DBApotheoseProvider
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
      provide: 'ICharacterProvider',
      useClass: DBCharacterProvider
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
      provide: 'IProficiencyProvider',
      useClass: DBProficiencyProvider
    }
  ]
})
export class PostgresModule {}
