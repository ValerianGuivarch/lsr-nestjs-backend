import { DBBloodline } from '../../data/database/bloodlines/DBBloodline'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitBloodlines {
  static getBloodlines(): DBBloodline[] {
    const aucunBloodline: DBBloodline = this.createBloodline({
      name: 'aucun',
      display: ''
    })
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
      name: 'lumiere',
      display: 'de la lumiere',
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
    detteByMagicAction?: number
    detteByPp?: number
    healthImproved?: boolean
  }): DBBloodline {
    const newBloodline = new DBBloodline()
    newBloodline.name = p.name
    newBloodline.display = p.display
    return newBloodline
  }
}
