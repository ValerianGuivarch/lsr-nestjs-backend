import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { SuccessCalculation } from '../../domain/models/roll/SuccessCalculation'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitBloodlines {
  static getBloodlines(skills: Map<string, DBSkill>, proficiencies: Map<string, DBProficiency>): DBBloodline[] {
    const aucunBloodline: DBBloodline = this.createBloodline({
      name: 'aucun',
      display: ''
    })
    const eauBloodline: DBBloodline = this.createBloodline({
      name: 'eau',
      display: "de l'Eau",
      skills: [skills.get('forme aqueuse')]
    })

    const feuBloodline: DBBloodline = this.createBloodline({
      name: 'feu',
      display: 'du Feu',
      skills: [skills.get('soin mental')]
    })

    const ventBloodline: DBBloodline = this.createBloodline({
      name: 'vent',
      display: 'du Vent',
      skills: [skills.get('vol')]
    })

    const terreBloodline: DBBloodline = this.createBloodline({
      name: 'terre',
      display: 'de la Terre',
      skills: [skills.get('armure')]
    })

    const lumiereBloodline: DBBloodline = this.createBloodline({
      name: 'lumière',
      display: 'de la lumière',
      skills: [
        {
          ...skills.get('soin'),
          successCalculation: SuccessCalculation.SIMPLE_PLUS_1
        }
      ]
    })

    const ombreBloodline: DBBloodline = this.createBloodline({
      name: 'ombre',
      display: 'des Ombres',
      skills: [skills.get('invisibilité')]
    })

    const foudreBloodline: DBBloodline = this.createBloodline({
      name: 'foudre',
      display: 'de la Foudre',
      skills: [skills.get('speed')]
    })

    const glaceBloodline: DBBloodline = this.createBloodline({
      name: 'glace',
      display: 'de la Glace',
      skills: [skills.get('malédiction')]
    })

    const neigeBloodline: DBBloodline = this.createBloodline({
      name: 'neige',
      display: 'de la Neige',
      skills: [skills.get('malédiction')]
    })

    const arbreBloodline: DBBloodline = this.createBloodline({
      name: 'arbre',
      display: "de l'Arbre"
    })

    const terreurBloodline: DBBloodline = this.createBloodline({
      name: 'terreur',
      display: 'de la Terreur'
    })

    const lycanBloodline: DBBloodline = this.createBloodline({
      name: 'lycan',
      display: 'Lycan'
    })

    const gouleBloodline: DBBloodline = this.createBloodline({
      name: 'goule',
      display: 'goule'
    })

    const succubeBloodline: DBBloodline = this.createBloodline({
      name: 'succube',
      display: 'succube'
    })

    const gorgoneBloodline: DBBloodline = this.createBloodline({
      name: 'gorgone',
      display: 'gorgone'
    })

    const illithideBloodline: DBBloodline = this.createBloodline({
      name: 'illithide',
      display: 'illithide'
    })

    const troglodyteBloodline: DBBloodline = this.createBloodline({
      name: 'troglodyte',
      display: 'troglodyte'
    })
    const nagaBloodline: DBBloodline = this.createBloodline({
      name: 'naga',
      display: 'naga'
    })

    const newBloodlines = [
      nagaBloodline,
      troglodyteBloodline,
      illithideBloodline,
      aucunBloodline,
      gorgoneBloodline,
      lycanBloodline,
      gouleBloodline,
      succubeBloodline,
      terreurBloodline,
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
    return newBloodlines
  }
  static createBloodline(p: {
    name: string
    display: string
    proficiencies?: DBProficiency[]
    skills?: DBSkill[]
  }): DBBloodline {
    const newBloodline = new DBBloodline()
    newBloodline.name = p.name
    newBloodline.display = p.display
    newBloodline.proficiencies = p.proficiencies || []
    newBloodline.skills = p.skills || []
    return newBloodline
  }
}
