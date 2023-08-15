import { ApotheoseVM } from './ApotheoseVM'
import { ProficiencyVM } from './ProficiencyVM'
import { SkillVM } from './SkillVM'
import { Apotheose } from '../../../../../../domain/models/apotheoses/Apotheose'
import { Bloodline } from '../../../../../../domain/models/characters/Bloodline'
import { Character } from '../../../../../../domain/models/characters/Character'
import { Classe } from '../../../../../../domain/models/characters/Classe'
import { Genre } from '../../../../../../domain/models/characters/Genre'
import { Proficiency } from '../../../../../../domain/models/proficiencies/Proficiency'
import { Skill } from '../../../../../../domain/models/skills/Skill'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CharacterVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  classe: {
    name: string
    display: string
  }

  @ApiProperty({ isArray: true, type: SkillVM })
  skills: SkillVM[]

  @ApiProperty({ isArray: true, type: ApotheoseVM })
  apotheoses: ApotheoseVM[]

  @ApiProperty()
  apotheoseState: string

  @ApiProperty()
  bloodline: {
    name: string
    display: string
  }

  @ApiProperty()
  chair: number

  @ApiProperty()
  esprit: number

  @ApiProperty()
  essence: number

  @ApiProperty()
  chairBonus: number

  @ApiProperty()
  espritBonus: number

  @ApiProperty()
  essenceBonus: number

  @ApiProperty()
  avantage: boolean

  @ApiProperty()
  pv: number

  @ApiProperty()
  pvMax: number

  @ApiProperty()
  pf: number

  @ApiProperty()
  pfMax: number

  @ApiProperty()
  pp: number

  @ApiProperty()
  ppMax: number

  @ApiProperty()
  dettes: number

  @ApiProperty()
  arcanes: number

  @ApiProperty()
  arcanesMax: number

  @ApiProperty()
  niveau: number

  @ApiProperty()
  lux: string

  @ApiProperty()
  umbra: string

  @ApiProperty()
  secunda: string

  @ApiProperty()
  notes: string

  @ApiProperty()
  battleState: string

  @ApiPropertyOptional()
  apotheoseName?: string

  @ApiPropertyOptional()
  apotheoseImprovement?: string

  @ApiProperty({ isArray: true, type: String })
  apotheoseImprovementList: string[]

  @ApiProperty()
  genre: string

  @ApiProperty()
  relance: number

  @ApiPropertyOptional()
  playerName?: string

  @ApiPropertyOptional()
  picture?: string

  @ApiPropertyOptional()
  pictureApotheose?: string

  @ApiPropertyOptional()
  background?: string

  @ApiPropertyOptional()
  buttonColor?: string

  @ApiPropertyOptional()
  textColor?: string

  @ApiProperty({ isArray: true, type: String })
  proficiencies: ProficiencyVM[]

  @ApiProperty()
  rest: number

  @ApiProperty()
  longRest: number

  @ApiProperty()
  isInvocation: boolean

  constructor(p: CharacterVM) {
    this.name = p.name
    this.isInvocation = p.isInvocation
    this.classe = p.classe
    this.bloodline = p.bloodline
    this.apotheoses = p.apotheoses
    this.apotheoseState = p.apotheoseState
    this.apotheoseName = p.apotheoseName
    this.apotheoseImprovement = p.apotheoseImprovement
    this.apotheoseImprovementList = p.apotheoseImprovementList
    this.chair = p.chair
    this.esprit = p.esprit
    this.essence = p.essence
    this.chairBonus = p.chairBonus
    this.espritBonus = p.espritBonus
    this.essenceBonus = p.essenceBonus
    this.avantage = p.avantage
    this.pv = p.pv
    this.pvMax = p.pvMax
    this.pf = p.pf
    this.pfMax = p.pfMax
    this.pp = p.pp
    this.ppMax = p.ppMax
    this.dettes = p.dettes
    this.arcanes = p.arcanes
    this.arcanesMax = p.arcanesMax
    this.skills = p.skills
    this.niveau = p.niveau
    this.lux = p.lux
    this.umbra = p.umbra
    this.secunda = p.secunda
    this.notes = p.notes
    this.battleState = p.battleState
    this.genre = p.genre
    this.relance = p.relance
    this.playerName = p.playerName
    this.picture = p.picture
    this.pictureApotheose = p.pictureApotheose
    this.background = p.background
    this.buttonColor = p.buttonColor
    this.textColor = p.textColor
    this.proficiencies = p.proficiencies
    this.rest = p.rest
    this.longRest = p.longRest
  }

  static of(p: {
    character: Character
    classe: Classe
    bloodline?: Bloodline
    skills: Skill[]
    proficiencies: Proficiency[]
    apotheoses: Apotheose[]
    rest: {
      baseRest: number
      longRest: number
    }
  }): CharacterVM {
    const currentApotheose = p.apotheoses.find((a) => a.name === p.character.apotheoseName)
    return new CharacterVM({
      name: p.character.name,
      isInvocation: p.character.isInvocation,
      classe: {
        name: p.character.classeName,
        display: p.character.genre === Genre.HOMME ? p.classe.displayMale : p.classe.displayFemale
      },
      bloodline: p.bloodline
        ? {
            name: p.bloodline.name,
            display: p.bloodline.display
          }
        : undefined,
      apotheoseState: p.character.apotheoseState,
      skills: p.skills.map((skill) =>
        SkillVM.of({
          skill
        })
      ),
      apotheoses: p.apotheoses.map((apotheose) =>
        ApotheoseVM.of({
          apotheose
        })
      ),
      proficiencies: p.proficiencies.map((proficiency) =>
        ProficiencyVM.of({
          proficiency
        })
      ),
      chair: p.character.chair,
      esprit: p.character.esprit,
      essence: p.character.essence,
      chairBonus: (p.character.chairBonus ?? 0) + (currentApotheose?.chairImprovement ?? 0),
      espritBonus: (p.character.espritBonus ?? 0) + (currentApotheose?.espritImprovement ?? 0),
      essenceBonus: (p.character.essenceBonus ?? 0) + (currentApotheose?.essenceImprovement ?? 0),
      avantage: false, //TODO
      pv: p.character.pv,
      pvMax: p.character.pvMax,
      pf: p.character.pf,
      pfMax: p.character.pfMax,
      pp: p.character.pp,
      ppMax: p.character.ppMax,
      dettes: p.character.dettes,
      arcanes: p.character.arcanes,
      arcanesMax: p.character.arcanesMax,
      niveau: p.character.niveau,
      lux: p.character.lux,
      umbra: p.character.umbra,
      secunda: p.character.secunda,
      notes: p.character.notes,
      battleState: p.character.battleState.toString(),
      apotheoseName: p.character.apotheoseName,
      apotheoseImprovement: p.character.apotheoseImprovement,
      apotheoseImprovementList: p.character.apotheoseImprovementList,
      genre: p.character.genre.toString(),
      relance: p.character.relance,
      playerName: p.character.playerName,
      picture: p.character.picture,
      pictureApotheose: p.character.pictureApotheose,
      background: p.character.background,
      buttonColor: p.character.buttonColor,
      textColor: p.character.textColor,
      rest: p.rest.baseRest,
      longRest: p.rest.longRest
    })
  }
}
