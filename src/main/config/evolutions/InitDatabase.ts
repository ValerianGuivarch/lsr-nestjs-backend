import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
import { SkillAttribution } from '../../domain/models/skills/SkillAttribution'
import { SkillCategory } from '../../domain/models/skills/SkillCategory'
import { SkillOwnedUse } from '../../domain/models/skills/SkillOwnedUse'
import { SkillStat } from '../../domain/models/skills/SkillStat'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitDatabase {
  constructor(
    @InjectRepository(DBClasse, 'postgres')
    private dbClasseRepository: Repository<DBClasse>,
    @InjectRepository(DBBloodline, 'postgres')
    private dbBloodlineRepository: Repository<DBBloodline>,
    @InjectRepository(DBSkill, 'postgres')
    private dbSkillRepository: Repository<DBSkill>
  ) {}

  async onModuleInit(): Promise<void> {
    const classes = [
      { name: 'champion', displayMale: 'Champion', displayFemale: 'Championne' },
      { name: 'corrompu', displayMale: 'Corrompu', displayFemale: 'Corrompue' },
      { name: 'rejeté', displayMale: 'Rejeté', displayFemale: 'Rejetée' },
      { name: 'pacificateur', displayMale: 'Pacificateur', displayFemale: 'Pacificatrice' },
      { name: 'spirite', displayMale: 'Spirit', displayFemale: 'Spirite' },
      { name: 'arcaniste', displayMale: 'Arcaniste', displayFemale: 'Arcaniste' },
      { name: 'champion arcanique', displayMale: 'Champion Arcanique', displayFemale: 'Championne Arcanique' },
      { name: 'soldat', displayMale: 'Soldat', displayFemale: 'Soldate' },
      { name: 'avatar', displayMale: 'Avatar', displayFemale: 'Avatar' },
      { name: 'skinwalker', displayMale: 'Skinwalker', displayFemale: 'Skinwalker' },
      { name: 'game master', displayMale: 'MJ', displayFemale: 'MJ' },
      { name: 'roi', displayMale: 'Roi', displayFemale: 'Roi' },
      { name: 'parolier', displayMale: 'Parolier', displayFemale: 'Parolière' },
      { name: 'dragon', displayMale: 'Dragon', displayFemale: 'Dragon' },
      { name: 'inconnu', displayMale: 'Inconnu', displayFemale: 'Inconnue' }
    ]
    for (const classeData of classes) {
      const existingClasse = await this.dbClasseRepository.findOneBy({ name: classeData.name })

      if (!existingClasse) {
        const classe = new DBClasse()
        classe.name = classeData.name
        classe.displayMale = classeData.displayMale
        classe.displayFemale = classeData.displayFemale
        this.dbClasseRepository.save(classe).then((r) => console.log(r))
      }
    }

    const bloodlines = [
      { name: 'eau', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: "de l'Eau" },
      { name: 'feu', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: 'du Feu' },
      { name: 'vent', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: 'du Vent' },
      { name: 'terre', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: 'de la Terre' },
      { name: 'lumière', detteByMagicAction: 1, detteByPp: 1, healthImproved: true, display: 'de la Lumière' },
      { name: 'ombre', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: 'des Ombres' },
      { name: 'foudre', detteByMagicAction: 2, detteByPp: 1, healthImproved: false, display: 'de la Foudre' },
      { name: 'glace', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: 'de la Glace' },
      { name: 'arbre', detteByMagicAction: 1, detteByPp: 1, healthImproved: false, display: "de l'arbre" }
    ]

    for (const bloodlineData of bloodlines) {
      const existingBloodline = await this.dbBloodlineRepository.findOneBy({ name: bloodlineData.name })

      if (!existingBloodline) {
        const bloodline = new DBBloodline()
        bloodline.name = bloodlineData.name
        bloodline.detteByMagicAction = bloodlineData.detteByMagicAction
        bloodline.detteByPp = bloodlineData.detteByPp
        bloodline.healthImproved = bloodlineData.healthImproved
        bloodline.display = bloodlineData.display
        this.dbBloodlineRepository.save(bloodline).then((r) => console.log(r))
      }
    }

    const skills: DBSkill[] = [
      {
        name: 'chair',
        attribution: SkillAttribution.ALL,
        allowsPf: true,
        allowsPp: true,
        stat: SkillStat.CHAIR,
        category: SkillCategory.STATS,
        use: SkillOwnedUse.UNLIMITED,
        limitedUse: 0,
        pvCost: 0,
        pfCost: 0,
        ppCost: 0,
        dettesCost: 0,
        arcaneCost: 0,
        customRolls: '',
        successCalculation: SuccessCalculation.SIMPLE,
        secret: false,
        display: 'fait un Jet de chair',
        attributionClasseList: [],
        attributionBloodlineList: []
      },
      {
        name: 'esprit',
        attribution: SkillAttribution.ALL,
        allowsPf: true,
        allowsPp: true,
        stat: SkillStat.ESPRIT,
        category: SkillCategory.STATS,
        use: SkillOwnedUse.UNLIMITED,
        limitedUse: 0,
        pvCost: 0,
        pfCost: 0,
        ppCost: 0,
        dettesCost: 0,
        arcaneCost: 0,
        customRolls: '',
        successCalculation: SuccessCalculation.SIMPLE,
        secret: false,
        display: "fait un Jet d'esprit",
        attributionClasseList: [],
        attributionBloodlineList: []
      },
      {
        name: 'essence',
        attribution: SkillAttribution.ALL,
        allowsPf: true,
        allowsPp: true,
        stat: SkillStat.ESSENCE,
        category: SkillCategory.STATS,
        use: SkillOwnedUse.UNLIMITED,
        limitedUse: 0,
        pvCost: 0,
        pfCost: 0,
        ppCost: 0,
        dettesCost: 0,
        arcaneCost: 0,
        customRolls: '',
        successCalculation: SuccessCalculation.SIMPLE,
        secret: false,
        display: "fait un Jet d'essence",
        attributionClasseList: [],
        attributionBloodlineList: []
      },
      {
        name: 'licorne',
        attribution: SkillAttribution.OWNED,
        allowsPf: true,
        allowsPp: false,
        stat: SkillStat.ESSENCE,
        category: SkillCategory.ARCANES,
        use: SkillOwnedUse.UNLIMITED,
        limitedUse: 0,
        pvCost: 0,
        pfCost: 0,
        ppCost: 0,
        dettesCost: 0,
        arcaneCost: 1,
        customRolls: '',
        successCalculation: SuccessCalculation.SIMPLE,
        secret: false,
        display: 'fait une *Licorne*',
        attributionClasseList: [],
        attributionBloodlineList: []
      },
      {
        name: 'cheval',
        attribution: SkillAttribution.OWNED,
        allowsPf: true,
        allowsPp: false,
        stat: SkillStat.ESPRIT,
        category: SkillCategory.ARCANES,
        use: SkillOwnedUse.UNLIMITED,
        limitedUse: 0,
        pvCost: 0,
        pfCost: 0,
        ppCost: 0,
        dettesCost: 0,
        arcaneCost: 1,
        customRolls: '',
        successCalculation: SuccessCalculation.SIMPLE,
        secret: false,
        display: 'fait un *Cheval*',
        attributionClasseList: [],
        attributionBloodlineList: []
      }
    ]

    for (const skillData of skills) {
      const existingSkill = await this.dbSkillRepository.findOneBy({ name: skillData.name })

      if (!existingSkill) {
        const skill = new DBSkill()
        skill.name = skillData.name
        skill.attribution = skillData.attribution
        skill.allowsPf = skillData.allowsPf
        skill.allowsPp = skillData.allowsPp
        skill.stat = skillData.stat
        skill.category = skillData.category
        skill.use = skillData.use
        skill.limitedUse = skillData.limitedUse
        skill.pvCost = skillData.pvCost
        skill.pfCost = skillData.pfCost
        skill.ppCost = skillData.ppCost
        skill.dettesCost = skillData.dettesCost
        skill.arcaneCost = skillData.arcaneCost
        skill.customRolls = skillData.customRolls
        skill.successCalculation = skillData.successCalculation
        skill.secret = skillData.secret
        skill.display = skillData.display

        this.dbSkillRepository.save(skill).then((r) => console.log(r))
      }
    }
  }
}
