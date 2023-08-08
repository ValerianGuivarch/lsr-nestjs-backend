import { ProficiencyVM } from './ProficiencyVM'
import { SkillVM } from './SkillVM'
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
  category: string

  @ApiProperty()
  battleState: string

  @ApiProperty()
  apotheoseName: string

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

  constructor(p: CharacterVM) {
    this.name = p.name
    this.classe = p.classe
    this.bloodline = p.bloodline
    this.apotheoseName = p.apotheoseName
    this.apotheoseImprovement = p.apotheoseImprovement
    this.apotheoseImprovementList = p.apotheoseImprovementList
    this.chair = p.chair
    this.esprit = p.esprit
    this.essence = p.essence
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
    this.category = p.category
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
  }

  static of(p: {
    character: Character
    classe: Classe
    bloodline?: Bloodline
    skills: Skill[]
    proficiencies: Proficiency[]
  }): CharacterVM {
    return new CharacterVM({
      name: p.character.name,
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
      skills: p.skills
        .map((skill) =>
          SkillVM.of({
            skill
          })
        )
        .sort((a, b) => a.position - b.position),
      proficiencies: p.proficiencies.map((proficiency) =>
        ProficiencyVM.of({
          proficiency
        })
      ),
      chair: p.character.chair,
      esprit: p.character.esprit,
      essence: p.character.essence,
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
      category: p.character.category.toString(),
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
      textColor: p.character.textColor
    })
  }
}
