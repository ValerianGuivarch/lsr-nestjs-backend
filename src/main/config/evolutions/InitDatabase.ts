import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DBBloodlineApotheose } from '../../data/database/apotheoses/DBBloodlineApotheose'
import { DBCharacterApotheose } from '../../data/database/apotheoses/DBCharacterApotheose'
import { DBClasseApotheose } from '../../data/database/apotheoses/DBClasseApotheose'
import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBCharacter } from '../../data/database/character/DBCharacter'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBBloodlineProficiency } from '../../data/database/proficiencies/DBBloodlineProficiency'
import { DBCharacterProficiency } from '../../data/database/proficiencies/DBCharacterProficiency'
import { DBClasseProficiency } from '../../data/database/proficiencies/DBClasseProficiency'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBBloodlineSkill } from '../../data/database/skills/DBBloodlineSkill'
import { DBCharacterSkill } from '../../data/database/skills/DBCharacterSkill'
import { DBClasseSkill } from '../../data/database/skills/DBClasseSkill'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { Category } from '../../domain/models/characters/Category'
import { DisplayCategory } from '../../domain/models/characters/DisplayCategory'
import { Genre } from '../../domain/models/characters/Genre'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
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
    private dbCharacterRepository: Repository<DBCharacter>,
    @InjectRepository(DBProficiency, 'postgres')
    private dbProficiencyRepository: Repository<DBProficiency>,
    @InjectRepository(DBClasseSkill, 'postgres')
    private dbClasseSkillRepository: Repository<DBClasseSkill>,
    @InjectRepository(DBBloodlineSkill, 'postgres')
    private dbBloodlineSkillRepository: Repository<DBBloodlineSkill>,
    @InjectRepository(DBCharacterSkill, 'postgres')
    private dbCharacterSkillRepository: Repository<DBCharacterSkill>,
    @InjectRepository(DBClasseProficiency, 'postgres')
    private dbClasseProficiencyRepository: Repository<DBClasseProficiency>,
    @InjectRepository(DBBloodlineProficiency, 'postgres')
    private dbBloodlineProficiencyRepository: Repository<DBBloodlineProficiency>,
    @InjectRepository(DBCharacterProficiency, 'postgres')
    private dbCharacterProficiencyRepository: Repository<DBCharacterProficiency>,
    @InjectRepository(DBApotheose, 'postgres')
    private dbApotheoseRepository: Repository<DBApotheose>,
    @InjectRepository(DBClasseApotheose, 'postgres')
    private dbClasseApotheoseRepository: Repository<DBClasseApotheose>,
    @InjectRepository(DBBloodlineApotheose, 'postgres')
    private dbBloodlineApotheoseRepository: Repository<DBBloodlineApotheose>,
    @InjectRepository(DBCharacterApotheose, 'postgres')
    private dbCharacterApotheoseRepository: Repository<DBCharacterApotheose>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.dbClasseSkillRepository.delete({})
    await this.dbBloodlineSkillRepository.delete({})
    await this.dbCharacterSkillRepository.delete({})
    await this.dbClasseApotheoseRepository.delete({})
    await this.dbBloodlineApotheoseRepository.delete({})
    await this.dbCharacterApotheoseRepository.delete({})
    await this.dbClasseProficiencyRepository.delete({})
    await this.dbBloodlineProficiencyRepository.delete({})
    await this.dbCharacterProficiencyRepository.delete({})
    await this.dbCharacterRepository.delete({})
    await this.dbClasseRepository.delete({})
    await this.dbBloodlineRepository.delete({})
    await this.dbSkillRepository.delete({})
    await this.dbApotheoseRepository.delete({})
    await this.dbProficiencyRepository.delete({})
    const skills = await this.initSkills()
    const proficiencies = await this.initProficiencies()
    const apotheoses = await this.initApotheoses()
    const classes = await this.initClasses()
    const bloodlines = await this.initBloodlines()
    const characters = await this.initCharacters(classes, bloodlines)
    await this.skillsAttribution(skills, classes, bloodlines, characters)
    await this.proficienciesAttribution(proficiencies, classes, bloodlines, characters)
    await this.apotheosesAttribution(apotheoses, classes, bloodlines, characters)
  }

  async initCharacters(
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>
  ): Promise<Map<string, DBCharacter>> {
    const jonathan: DBCharacter = this.createCharacter({
      name: 'jonathan',
      classe: classes.get('champion'),
      bloodline: bloodlines.get('lumière'),
      chair: 9,
      esprit: 2,
      essence: 8,
      niveau: 18,
      lux: 'Hyper social',
      umbra: 'Tendance psychopathe',
      secunda: 'Cuisinier hair pair',
      category: Category.PJ,
      genre: Genre.HOMME,
      picture: 'https://media.discordapp.net/attachments/689044605311647799/1001476340358328380/unknown.png',
      pictureApotheose: 'https://media.discordapp.net/attachments/689044605311647799/1006315258585034802/unknown.png',
      background:
        'https://media.discordapp.net/attachments/689044605311647799/1001506417561325568/unknown.png?width=2160&height=1021',
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
      allAttribution: true,
      stat: SkillStat.CHAIR,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet de Chair*',
      position: 1
    })
    const espritSkill: DBSkill = this.createSkill({
      name: 'esprit',
      allAttribution: true,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Esprit*",
      position: 2
    })
    const essenceSkill: DBSkill = this.createSkill({
      name: 'essence',
      allAttribution: true,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.STATS,
      display: "fait un *Jet d'Essence*",
      position: 3
    })
    const empiriqueSkill: DBSkill = this.createSkill({
      name: 'empirique',
      allAttribution: true,
      stat: SkillStat.EMPIRIQUE,
      category: DisplayCategory.STATS,
      display: 'fait un *Jet Empirique*',
      position: 4,
      successCalculation: SuccessCalculation.AUCUN
    })
    const magieSkill: DBSkill = this.createSkill({
      name: 'magie',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie*',
      position: 1,
      dettesCost: 1
    })
    const cantripSkill: DBSkill = this.createSkill({
      name: 'cantrip',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.MAGIE,
      display: 'fait un *Jet de Magie Légère*',
      position: 1,
      ppCost: 1
    })
    const arbreSkill: DBSkill = this.createSkill({
      name: 'arbre',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Arbre*',
      position: 20,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const mortSkill: DBSkill = this.createSkill({
      name: 'mort',
      allAttribution: false,
      stat: SkillStat.FIXE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Arcane de la Mort*',
      position: 94,
      successCalculation: SuccessCalculation.AUCUN,
      arcaneCost: 1,
      isArcanique: true
    })
    const licorneSkill: DBSkill = this.createSkill({
      name: 'licorne',
      allAttribution: false,
      stat: SkillStat.ESSENCE,
      category: DisplayCategory.ARCANES,
      display: 'fait une *Licorne*',
      position: 23,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const chevalSkill: DBSkill = this.createSkill({
      name: 'cheval',
      allAttribution: false,
      stat: SkillStat.ESPRIT,
      category: DisplayCategory.ARCANES,
      display: 'fait un *Cheval*',
      position: 24,
      successCalculation: SuccessCalculation.SIMPLE_PLUS_1,
      arcaneCost: 1,
      isArcanique: true
    })
    const newSkills = [
      chairSkill,
      espritSkill,
      essenceSkill,
      empiriqueSkill,
      magieSkill,
      cantripSkill,
      licorneSkill,
      chevalSkill,
      arbreSkill,
      mortSkill
    ]
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
  async initProficiencies(): Promise<Map<string, DBProficiency>> {
    const lumiereSagesse: DBProficiency = this.createProficiency({
      name: 'sagesse',
      category: DisplayCategory.MAGIE,
      minLevel: 1
    })
    const lumiereCharisme: DBProficiency = this.createProficiency({
      name: 'charisme',
      category: DisplayCategory.MAGIE,
      minLevel: 10
    })
    const newProficiencies = [lumiereSagesse, lumiereCharisme]
    const proficiencies = new Map<string, DBProficiency>()
    for (const proficiencyData of newProficiencies) {
      const existingProficiency = await this.dbProficiencyRepository.findOneBy({ name: proficiencyData.name })
      if (!existingProficiency) {
        const proficiency = new DBProficiency()
        Object.assign(proficiency, proficiencyData)
        const createdProficiency = await this.dbProficiencyRepository.save(proficiency)
        proficiencies.set(proficiency.name, createdProficiency)
      } else {
        proficiencies.set(existingProficiency.name, existingProficiency)
      }
    }
    return proficiencies
  }

  async initApotheoses(): Promise<Map<string, DBApotheose>> {
    const apotheoseBasic: DBApotheose = this.createApotheose({
      name: 'apotheose',
      category: DisplayCategory.MAGIE,
      maxLevel: 9,
      position: 1
    })
    const apotheoseAmelioree: DBApotheose = this.createApotheose({
      name: 'apotheose améliorée',
      category: DisplayCategory.MAGIE,
      minLevel: 10,
      position: 5
    })
    const apotheoseFinal: DBApotheose = this.createApotheose({
      name: 'apotheose finale',
      category: DisplayCategory.MAGIE,
      minLevel: 20,
      position: 10,
      chairImprovement: 5,
      espritImprovement: 5,
      essenceImprovement: 5
    })
    const newApotheoses = [apotheoseBasic, apotheoseAmelioree, apotheoseFinal]
    const apotheoses = new Map<string, DBApotheose>()
    for (const apotheoseData of newApotheoses) {
      const existingApotheose = await this.dbApotheoseRepository.findOneBy({ name: apotheoseData.name })
      if (!existingApotheose) {
        const apotheose = new DBApotheose()
        Object.assign(apotheose, apotheoseData)
        const createdPApotheose = await this.dbApotheoseRepository.save(apotheose)
        apotheoses.set(apotheose.name, createdPApotheose)
      } else {
        apotheoses.set(existingApotheose.name, existingApotheose)
      }
    }
    return apotheoses
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

  async initClasses(): Promise<Map<string, DBClasse>> {
    const championClasse: DBClasse = this.createClasse({
      name: 'champion',
      displayMale: 'Champion',
      displayFemale: 'Championne'
    })
    const corrompuClasse: DBClasse = this.createClasse({
      name: 'corrompu',
      displayMale: 'Corrompu',
      displayFemale: 'Corrompue'
    })
    const rejeteClasse: DBClasse = this.createClasse({
      name: 'rejeté',
      displayMale: 'Rejeté',
      displayFemale: 'Rejetée'
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
      displayFemale: 'Reine'
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
  createClasse(p: { name: string; displayMale: string; displayFemale: string }): DBClasse {
    const newClass = new DBClasse()
    newClass.name = p.name
    newClass.displayMale = p.displayMale
    newClass.displayFemale = p.displayFemale
    return newClass
  }
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
    newCharacter.pfMax = p.pfMax || p.esprit
    // eslint-disable-next-line no-magic-numbers
    newCharacter.ppMax = p.ppMax || p.essence
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
    allAttribution: boolean
    stat: SkillStat
    category: DisplayCategory
    display: string
    position: number
    isArcanique?: boolean
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
      allAttribution: p.allAttribution,
      allowsPf: p.allowsPf || true,
      allowsPp: p.allowsPp || true,
      stat: p.stat,
      displayCategory: p.category,
      pvCost: p.pvCost || 0,
      pfCost: p.pfCost || 0,
      ppCost: p.ppCost || 0,
      dettesCost: p.dettesCost || 0,
      arcaneCost: p.arcaneCost || 0,
      customRolls: p.customRolls || '',
      successCalculation: p.successCalculation || SuccessCalculation.SIMPLE,
      secret: p.secret || false,
      display: p.display,
      position: p.position,
      isArcanique: p.isArcanique
    }
  }

  createProficiency(p: { name: string; category: DisplayCategory; minLevel?: number }): DBProficiency {
    return {
      name: p.name,
      displayCategory: p.category,
      minLevel: p.minLevel || 1
    }
  }

  createApotheose(p: {
    name: string
    category: DisplayCategory
    position: number
    minLevel?: number
    maxLevel?: number
    cost?: number
    chairImprovement?: number
    espritImprovement?: number
    essenceImprovement?: number
    arcaneImprovement?: boolean
    avantage?: boolean
    apotheoseEffect?: string[]
  }): DBApotheose {
    return {
      name: p.name,
      displayCategory: p.category,
      position: p.position,
      // eslint-disable-next-line no-magic-numbers
      maxLevel: p.maxLevel || 100,
      minLevel: p.minLevel || 1,
      // eslint-disable-next-line no-magic-numbers
      cost: p.cost || 3,
      // eslint-disable-next-line no-magic-numbers
      chairImprovement: p.chairImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      espritImprovement: p.espritImprovement || 3,
      // eslint-disable-next-line no-magic-numbers
      essenceImprovement: p.essenceImprovement || 3,
      arcaneImprovement: p.arcaneImprovement || false,
      avantage: p.avantage || false,
      apotheoseEffect: p.apotheoseEffect || [
        'perd le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle',
        'garde le contrôle'
      ]
    }
  }

  private async skillsAttribution(
    skills: Map<string, DBSkill>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('magie'))
    await this.saveClasseSkillIfNotExisting(classes.get('champion'), skills.get('cantrip'))
    await this.saveCharacterSkillIfNotExisting(characters.get('jonathan'), skills.get('arbre'))
    await this.saveCharacterSkillIfNotExisting(characters.get('jonathan'), skills.get('mort'))
  }

  private async saveClasseSkillIfNotExisting(classe: DBClasse, skill: DBSkill) {
    const existingRelation = await this.dbClasseSkillRepository.findOne({
      where: {
        classeName: classe.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseSkillRepository.save({
        classe: classe,
        skill: skill,
        classeName: classe.name,
        skillName: skill.name
      })
    }
  }
  private async saveBloodlineSkillIfNotExisting(bloodline: DBBloodline, skill: DBSkill) {
    const existingRelation = await this.dbBloodlineSkillRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineSkillRepository.save({
        bloodline: bloodline,
        skill: skill,
        bloodlineName: bloodline.name,
        skillName: skill.name
      })
    }
  }
  private async saveCharacterSkillIfNotExisting(character: DBCharacter, skill: DBSkill) {
    const existingRelation = await this.dbCharacterSkillRepository.findOne({
      where: {
        characterName: character.name,
        skillName: skill.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterSkillRepository.save({
        character: character,
        skill: skill,
        characterName: character.name,
        skillName: skill.name
      })
    }
  }

  private async proficienciesAttribution(
    proficiencies: Map<string, DBProficiency>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumière'), proficiencies.get('sagesse'))
    await this.saveBloodlineProficiencyIfNotExisting(bloodlines.get('lumière'), proficiencies.get('charisme'))
  }

  private async saveClasseProficiencyIfNotExisting(classe: DBClasse, proficiency: DBProficiency) {
    const existingRelation = await this.dbClasseProficiencyRepository.findOne({
      where: {
        classeName: classe.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseProficiencyRepository.save({
        classe: classe,
        proficiency: proficiency,
        classeName: classe.name,
        proficiencyName: proficiency.name
      })
    }
  }
  private async saveBloodlineProficiencyIfNotExisting(bloodline: DBBloodline, proficiency: DBProficiency) {
    const existingRelation = await this.dbBloodlineProficiencyRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineProficiencyRepository.save({
        bloodline: bloodline,
        proficiency: proficiency,
        bloodlineName: bloodline.name,
        proficiencyName: proficiency.name
      })
    }
  }
  private async saveCharacterProficiencyIfNotExisting(character: DBCharacter, proficiency: DBProficiency) {
    const existingRelation = await this.dbCharacterProficiencyRepository.findOne({
      where: {
        characterName: character.name,
        proficiencyName: proficiency.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterProficiencyRepository.save({
        character: character,
        proficiency: proficiency,
        characterName: character.name,
        proficiencyName: proficiency.name
      })
    }
  }

  private async apotheosesAttribution(
    apotheoses: Map<string, DBApotheose>,
    classes: Map<string, DBClasse>,
    bloodlines: Map<string, DBBloodline>,
    characters: Map<string, DBCharacter>
  ) {
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose'))
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose améliorée'))
    await this.saveClasseApotheoseIfNotExisting(classes.get('champion'), apotheoses.get('apotheose finale'))
  }

  private async saveClasseApotheoseIfNotExisting(classe: DBClasse, apotheose: DBApotheose) {
    const existingRelation = await this.dbClasseApotheoseRepository.findOne({
      where: {
        classeName: classe.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbClasseApotheoseRepository.save({
        classe: classe,
        apotheose: apotheose,
        classeName: classe.name,
        apotheoseName: apotheose.name
      })
    }
  }
  private async saveBloodlineApotheoseIfNotExisting(bloodline: DBBloodline, apotheose: DBApotheose) {
    const existingRelation = await this.dbBloodlineApotheoseRepository.findOne({
      where: {
        bloodlineName: bloodline.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbBloodlineApotheoseRepository.save({
        bloodline: bloodline,
        apotheose: apotheose,
        bloodlineName: bloodline.name,
        apotheoseName: apotheose.name
      })
    }
  }
  private async saveCharacterApotheoseIfNotExisting(character: DBCharacter, apotheose: DBApotheose) {
    const existingRelation = await this.dbCharacterApotheoseRepository.findOne({
      where: {
        characterName: character.name,
        apotheoseName: apotheose.name
      }
    })
    if (!existingRelation) {
      await this.dbCharacterApotheoseRepository.save({
        character: character,
        apotheose: apotheose,
        characterName: character.name,
        apotheoseName: apotheose.name
      })
    }
  }
}
