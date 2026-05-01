import { DBFlip } from '../flip.db'
import { DBHouse } from '../house.db'
import { DBKnowledge } from '../knowledge.db'
import { DBSpell } from '../spell.db'
import { DBStat } from '../stat.db'
import { DBWizardKnowledge } from '../wizard-knowledge.db'
import { DBWizardSpell } from '../wizard-spell.db'
import { DBWizardStat } from '../wizard-stat.db'
import { DBWizard } from '../wizard.db'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [DBWizard, DBSpell, DBWizardSpell, DBStat, DBWizardStat, DBKnowledge, DBHouse, DBWizardKnowledge, DBFlip],
      'postgres'
    )
  ],
  exports: [TypeOrmModule]
})
export class PostgresModule {}
