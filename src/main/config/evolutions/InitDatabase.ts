import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBCharacter } from '../../data/database/character/DBCharacter'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { Category } from '../../domain/models/characters/Category'
import { Genre } from '../../domain/models/characters/Genre'
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
    private dbSkillRepository: Repository<DBSkill>,
    @InjectRepository(DBCharacter, 'postgres')
    private dbCharacterRepository: Repository<DBCharacter>
  ) {}

  async onModuleInit(): Promise<void> {
    const skills = await this.initSkills()
    const classes = await this.initClasses(skills)
    const bloodlines = await this.initBloodlines()
    const characters = await this.initCharacters(classes, bloodlines, skills)
  }

  /*async initClasseSkills(
    classes: Map<string, DBClasse>,
    skills: Map<string, DBSkill>
  ): Promise<Map<string, DBClasseSkill>> {
    const tst = this.createClassSkill({
      classe: classes.get('champion'),
      skill: skills.get('cantrip')
    })
    const newClasseSkills = [tst]
    const classeSkills = new Map<string, DBClasseSkill>()
    for (const classeSkillData of newClasseSkills) {
      const existingClasseSkill = await this.dbClasseSkillRepository.findOneBy({
        classeName: classeSkillData.classeName,
        skillName: classeSkillData.skillName
      })
      if (!existingClasseSkill) {
        const classeSkill = new DBClasseSkill()
        Object.assign(classeSkill, classeSkillData)
        const createdClasseSkill = await this.dbClasseSkillRepository.save(classeSkill)
        classeSkills.set(classeSkill.id.toString(), createdClasseSkill)
      } else {
        classeSkills.set(existingClasseSkill.id.toString(), existingClasseSkill)
      }
    }
    return classeSkills
  }*/
  async initCharacters(
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    skills: Map<string, DBSkill>
  ): Promise<Map<string, DBCharacter>> {
    const jonathan: DBCharacter = this.createCharacter({
      name: 'jonathan',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 3,
      esprit: 2,
      essence: 1,
      pvMax: 10,
      pfMax: 10,
      ppMax: 10,
      arcanesMax: 10,
      niveau: 1,
      lux: 'bleu',
      umbra: 'bleu',
      secunda: 'bleu',
      category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://i.imgur.com/3QfZQ5u.jpg',
      pictureApotheose: 'https://i.imgur.com/3QfZQ5u.jpg',
      background: 'https://i.imgur.com/3QfZQ5u.jpg',
      playerName: 'valou'
    })

    const newCharacters = [jonathan]
    const characters = new Map<string, DBCharacter>()
    for (const characterData of newCharacters) {
      const existingCharacter = await this.dbCharacterRepository.findOneBy({ name: characterData.name })
      if (!existingCharacter) {
        const character = new DBCharacter()
        Object.assign(character, characterData)
        const createdCharacter = await this.dbCharacterRepository.save(character)
        characters.set(character.name, createdCharacter)
      } else {
        characters.set(existingCharacter.name, existingCharacter)
      }
    }
    return characters
  }
  async initSkills(): Promise<Map<string, DBSkill>> {
    const chairSkill: DBSkill = this.createSkill({
      name: 'chair',
      attribution: SkillAttribution.ALL,
      stat: SkillStat.CHAIR,
      category: SkillCategory.STATS,
      display: 'fait un *Jet de Chair*',
      position: 1
    })

    const espritSkill: DBSkill = this.createSkill({
      name: 'esprit',
      attribution: SkillAttribution.ALL,
      stat: SkillStat.ESPRIT,
      category: SkillCategory.STATS,
      display: "fait un *Jet d'Esprit*",
      position: 2
    })

    const essenceSkill: DBSkill = this.createSkill({
      name: 'essence',
      attribution: SkillAttribution.ALL,
      stat: SkillStat.ESSENCE,
      category: SkillCategory.STATS,
      display: "fait un *Jet d'Essence*",
      position: 3
    })

    const magieSkill: DBSkill = this.createSkill({
      name: 'magie',
      attribution: SkillAttribution.ALL,
      stat: SkillStat.ESSENCE,
      category: SkillCategory.STATS,
      display: 'fait un *Jet de Magie*',
      position: 1,
      dettesCost: 1
    })

    const cantripSkill: DBSkill = this.createSkill({
      name: 'cantrip',
      attribution: SkillAttribution.CLASSES,
      stat: SkillStat.ESSENCE,
      category: SkillCategory.STATS,
      display: 'fait un *Jet de Magie Légère*',
      position: 1,
      ppCost: 1
    })

    const licorneSkill: DBSkill = this.createSkill({
      name: 'licorne',
      attribution: SkillAttribution.OWNED,
      stat: SkillStat.ESSENCE,
      category: SkillCategory.ARCANES,
      display: 'fait une *Licorne*',
      position: 23,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1
    })

    const chevalSkill: DBSkill = this.createSkill({
      name: 'cheval',
      attribution: SkillAttribution.OWNED,
      stat: SkillStat.ESPRIT,
      category: SkillCategory.ARCANES,
      display: 'fait un *Cheval*',
      position: 24,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1
    })

    const newSkills = [chairSkill, espritSkill, essenceSkill, magieSkill, cantripSkill, licorneSkill, chevalSkill]
    const skills = new Map<string, DBSkill>()
    for (const skillData of newSkills) {
      const existingSkill = await this.dbSkillRepository.findOneBy({ name: skillData.name })
      if (!existingSkill) {
        const skill = new DBSkill()
        Object.assign(skill, skillData)
        const createdSkill = await this.dbSkillRepository.save(skill)
        skills.set(skill.name, createdSkill)
      } else {
        skills.set(existingSkill.name, existingSkill)
      }
    }
    return skills
  }
  async initBloodlines(): Promise<Map<string, DBBloodline>> {
    const eauBloodline: DBBloodline = this.createBloodline({
      name: 'eau',
      display: "de l'Eau"
    })

    const feuBloodline: DBBloodline = this.createBloodline({
      name: 'feu',
      display: 'du Feu',
      detteByMagicAction: 2
    })

    const ventBloodline: DBBloodline = this.createBloodline({
      name: 'vent',
      display: 'du Vent'
    })

    const terreBloodline: DBBloodline = this.createBloodline({
      name: 'terre',
      display: 'de la Terre'
    })

    const lumiereBloodline: DBBloodline = this.createBloodline({
      name: 'lumière',
      display: 'de la Lumière',
      healthImproved: true
    })

    const ombreBloodline: DBBloodline = this.createBloodline({
      name: 'ombre',
      display: 'des Ombres'
    })

    const foudreBloodline: DBBloodline = this.createBloodline({
      name: 'foudre',
      display: 'de la Foudre'
    })

    const glaceBloodline: DBBloodline = this.createBloodline({
      name: 'glace',
      display: 'de la Glace'
    })

    const neigeBloodline: DBBloodline = this.createBloodline({
      name: 'neige',
      display: 'de la Neige'
    })

    const arbreBloodline: DBBloodline = this.createBloodline({
      name: 'arbre',
      display: "de l'Arbre"
    })

    const newBloodlines = [
      eauBloodline,
      feuBloodline,
      ventBloodline,
      terreBloodline,
      lumiereBloodline,
      ombreBloodline,
      foudreBloodline,
      glaceBloodline,
      neigeBloodline,
      arbreBloodline
    ]

    const bloodlines = new Map<string, DBBloodline>()
    for (const bloodlineData of newBloodlines) {
      const existingBloodline = await this.dbBloodlineRepository.findOneBy({ name: bloodlineData.name })
      if (!existingBloodline) {
        const bloodline = new DBBloodline()
        Object.assign(bloodline, bloodlineData)
        const createdBloodline = await this.dbBloodlineRepository.save(bloodline)
        bloodlines.set(bloodline.name, createdBloodline)
      } else {
        bloodlines.set(existingBloodline.name, existingBloodline)
      }
    }
    return bloodlines
  }

  async initClasses(skills: Map<string, DBSkill>): Promise<Map<string, DBClasse>> {
    const championClasse: DBClasse = this.createClasse({
      name: 'champion',
      displayMale: 'Champion',
      displayFemale: 'Championne',
      skills: [skills.get('cantrip'), skills.get('magie')]
    })
    const corrompuClasse: DBClasse = this.createClasse({
      name: 'corrompu',
      displayMale: 'Corrompu',
      displayFemale: 'Corrompue',
      skills: [skills.get('cantrip'), skills.get('magie')]
    })
    const rejeteClasse: DBClasse = this.createClasse({
      name: 'rejeté',
      displayMale: 'Rejeté',
      displayFemale: 'Rejetée',
      skills: [skills.get('cantrip'), skills.get('magie')]
    })
    const pacificateurClasse: DBClasse = this.createClasse({
      name: 'pacificateur',
      displayMale: 'Pacificateur',
      displayFemale: 'Pacificatrice'
    })
    const spiriteClasse: DBClasse = this.createClasse({
      name: 'spirite',
      displayMale: 'Spirit',
      displayFemale: 'Spirite'
    })
    const arcanisteClasse: DBClasse = this.createClasse({
      name: 'arcaniste',
      displayMale: 'Arcaniste',
      displayFemale: 'Arcaniste'
    })
    const championArcaniqueClasse: DBClasse = this.createClasse({
      name: 'champion arcanique',
      displayMale: 'Champion Arcanique',
      displayFemale: 'Championne Arcanique'
    })
    const soldatClasse: DBClasse = this.createClasse({
      name: 'soldat',
      displayMale: 'Soldat',
      displayFemale: 'Soldate'
    })
    const avatarClasse: DBClasse = this.createClasse({
      name: 'avatar',
      displayMale: 'Avatar',
      displayFemale: 'Avatar'
    })
    const skinwalkerClasse: DBClasse = this.createClasse({
      name: 'skinwalker',
      displayMale: 'Skinwalker',
      displayFemale: 'Skinwalker'
    })
    const roiClasse: DBClasse = this.createClasse({
      name: 'roi',
      displayMale: 'Roi',
      displayFemale: 'Reine',
      skills: [skills.get('cantrip'), skills.get('magie')]
    })
    const parolierClasse: DBClasse = this.createClasse({
      name: 'parolier',
      displayMale: 'Parolier',
      displayFemale: 'Parolière'
    })
    const dragonClasse: DBClasse = this.createClasse({
      name: 'dragon',
      displayMale: 'Dragon',
      displayFemale: 'Dragon'
    })
    const inconnuClasse: DBClasse = this.createClasse({
      name: 'inconnu',
      displayMale: 'Inconnu',
      displayFemale: 'Inconnue'
    })
    const newClasses: DBClasse[] = [
      championClasse,
      corrompuClasse,
      rejeteClasse,
      pacificateurClasse,
      spiriteClasse,
      arcanisteClasse,
      championArcaniqueClasse,
      soldatClasse,
      avatarClasse,
      skinwalkerClasse,
      roiClasse,
      parolierClasse,
      dragonClasse,
      inconnuClasse
    ]

    const classes = new Map<string, DBClasse>()
    for (const classeData of newClasses) {
      const existingClasse = await this.dbClasseRepository.findOneBy({ name: classeData.name })
      if (!existingClasse) {
        const classe = new DBClasse()
        Object.assign(classe, classeData)
        const createdClasse = await this.dbClasseRepository.save(classe)
        classes.set(classe.name, createdClasse)
      } else {
        classes.set(existingClasse.name, existingClasse)
      }
    }
    return classes
  }
  createClasse(p: { name: string; displayMale: string; displayFemale: string; skills?: DBSkill[] }): DBClasse {
    const newClass = new DBClasse()
    newClass.name = p.name
    newClass.displayMale = p.displayMale
    newClass.displayFemale = p.displayFemale
    newClass.skills = p.skills || []
    return newClass
  }
  /*
  createClassSkill(p: { classe: DBClasse; skill: DBSkill }): DBClasseSkill {
    const newClasseSkill = new DBClasseSkill()
    newClasseSkill.classe = p.classe
    newClasseSkill.classeName = p.classe.name
    newClasseSkill.skill = p.skill
    newClasseSkill.skillName = p.skill.name
    return newClasseSkill
  }*/
  createCharacter(p: {
    name: string
    classe: DBClasse
    bloodline: DBBloodline
    chair: number
    esprit: number
    essence: number
    niveau: number
    pvMax?: number
    pfMax?: number
    ppMax?: number
    lux?: string
    umbra?: string
    secunda?: string
    arcanesMax?: number
    category: Category
    genre: Genre
    picture?: string
    pictureApotheose?: string
    background?: string
    playerName?: string
  }): DBCharacter {
    const newCharacter = new DBCharacter()
    newCharacter.name = p.name
    newCharacter.classe = p.classe
    newCharacter.classeName = p.classe.name
    newCharacter.bloodline = p.bloodline
    newCharacter.bloodlineName = p.bloodline.name
    newCharacter.chair = p.chair
    newCharacter.esprit = p.esprit
    newCharacter.essence = p.essence
    newCharacter.niveau = p.niveau
    // eslint-disable-next-line no-magic-numbers
    newCharacter.pvMax = p.pvMax || p.chair * 2
    // eslint-disable-next-line no-magic-numbers
    newCharacter.pfMax = p.pfMax || p.esprit * 2
    // eslint-disable-next-line no-magic-numbers
    newCharacter.ppMax = p.ppMax || p.essence * 2
    newCharacter.pv = newCharacter.pvMax
    newCharacter.pf = newCharacter.pfMax
    newCharacter.pp = newCharacter.ppMax
    newCharacter.lux = p.lux || ''
    newCharacter.umbra = p.umbra || ''
    newCharacter.secunda = p.secunda || ''
    // eslint-disable-next-line no-magic-numbers
    newCharacter.arcanesMax = p.arcanesMax || 3
    newCharacter.arcanes = newCharacter.arcanesMax
    newCharacter.category = p.category
    newCharacter.genre = p.genre
    newCharacter.picture = p.picture || ''
    newCharacter.pictureApotheose = p.pictureApotheose || ''
    newCharacter.background = p.background || ''
    newCharacter.playerName = p.playerName || ''
    return newCharacter
  }

  createBloodline(p: {
    name: string
    display: string
    detteByMagicAction?: number
    detteByPp?: number
    healthImproved?: boolean
  }): DBBloodline {
    const newBloodline = new DBBloodline()
    newBloodline.name = p.name
    newBloodline.display = p.display
    newBloodline.detteByMagicAction = p.detteByMagicAction || 1
    newBloodline.detteByPp = p.detteByPp || 1
    newBloodline.healthImproved = p.healthImproved || false
    return newBloodline
  }

  createSkill(p: {
    name: string
    attribution: SkillAttribution
    stat: SkillStat
    category: SkillCategory
    display: string
    position: number
    allowsPf?: boolean
    allowsPp?: boolean
    use?: SkillOwnedUse
    limitedUse?: number
    pvCost?: number
    pfCost?: number
    ppCost?: number
    dettesCost?: number
    arcaneCost?: number
    customRolls?: string
    successCalculation?: SuccessCalculation
    secret?: boolean
  }): DBSkill {
    return {
      name: p.name,
      attribution: p.attribution,
      allowsPf: p.allowsPf || true,
      allowsPp: p.allowsPp || true,
      stat: p.stat,
      category: p.category,
      use: p.use || SkillOwnedUse.UNLIMITED,
      limitedUse: p.limitedUse || 1,
      pvCost: p.pvCost || 0,
      pfCost: p.pfCost || 0,
      ppCost: p.ppCost || 0,
      dettesCost: p.dettesCost || 0,
      arcaneCost: p.arcaneCost || 0,
      customRolls: p.customRolls || '',
      successCalculation: p.successCalculation || SuccessCalculation.SIMPLE,
      secret: p.secret || false,
      display: p.display,
      position: p.position
    }
  }
}
