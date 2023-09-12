import { DBApotheose } from '../../data/database/apotheoses/DBApotheose'
import { DBClasse } from '../../data/database/classes/DBClasse'
import { DBProficiency } from '../../data/database/proficiencies/DBProficiency'
import { DBSkill } from '../../data/database/skills/DBSkill'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitClasses {
  static getClasses(
    skills: Map<string, DBSkill>,
    proficiencies: Map<string, DBProficiency>,
    apotheoses: Map<string, DBApotheose>
  ): DBClasse[] {
    const championClasse: DBClasse = this.createClasse({
      name: 'champion',
      displayMale: 'Champion',
      displayFemale: 'Championne',
      apotheoses: [
        apotheoses.get('apotheose'),
        apotheoses.get('apotheose améliorée'),
        apotheoses.get('apotheose finale')
      ],
      skills: [skills.get('magie'), skills.get('cantrip'), skills.get('soin')]
    })
    const corrompuClasse: DBClasse = this.createClasse({
      name: 'corrompu',
      displayMale: 'Corrompu',
      displayFemale: 'Corrompue',
      apotheoses: [
        apotheoses.get('apotheose'),
        apotheoses.get('apotheose améliorée'),
        apotheoses.get('apotheose finale')
      ],
      skills: [skills.get('magie'), skills.get('cantrip'), skills.get('soin')]
    })
    const rejeteClasse: DBClasse = this.createClasse({
      name: 'rejete',
      displayMale: 'Rejeté',
      displayFemale: 'Rejetée',
      apotheoses: [
        apotheoses.get('apotheose'),
        apotheoses.get('apotheose améliorée'),
        apotheoses.get('apotheose finale')
      ],
      skills: [skills.get('magie'), skills.get('cantrip'), skills.get('soin')]
    })
    const pacificateurClasse: DBClasse = this.createClasse({
      name: 'pacificateur',
      displayMale: 'Pacificateur',
      displayFemale: 'Pacificatrice',
      skills: [
        skills.get('perturbation essence'),
        skills.get('destruction essence'),
        skills.get('Vol de magie'),
        skills.get('Emprunt de magie')
      ],
      apotheoses: [apotheoses.get('surcharge')]
    })
    const spiriteClasse: DBClasse = this.createClasse({
      name: 'spirite',
      displayMale: 'Spirit',
      displayFemale: 'Spirite'
    })
    const arcanisteClasse: DBClasse = this.createClasse({
      name: 'arcaniste',
      displayMale: 'Arcaniste',
      displayFemale: 'Arcaniste',
      canUsePp: false
    })
    const championArcaniqueClasse: DBClasse = this.createClasse({
      name: 'champion arcanique',
      displayMale: 'Champion Arcanique',
      displayFemale: 'Championne Arcanique',
      apotheoses: [apotheoses.get('apotheose arcanique'), apotheoses.get('apotheose arcanique finale')]
    })
    const soldatClasse: DBClasse = this.createClasse({
      name: 'soldat',
      displayMale: 'Soldat',
      displayFemale: 'Soldate',
      canUsePp: false
    })
    const avatarClasse: DBClasse = this.createClasse({
      name: 'avatar',
      displayMale: 'Avatar',
      displayFemale: 'Avatar',
      apotheoses: [apotheoses.get('apotheose arcanique'), apotheoses.get('apotheose arcanique finale')]
    })
    const skinwalkerClasse: DBClasse = this.createClasse({
      name: 'skinwalker',
      displayMale: 'Skinwalker',
      displayFemale: 'Skinwalker',
      apotheoses: [apotheoses.get('apotheose arcanique'), apotheoses.get('apotheose arcanique finale')]
    })
    const roiClasse: DBClasse = this.createClasse({
      name: 'roi',
      displayMale: 'Roi',
      displayFemale: 'Reine',
      apotheoses: [apotheoses.get('apotheose finale')]
    })
    const parolierClasse: DBClasse = this.createClasse({
      name: 'parolier',
      displayMale: 'Parolier',
      displayFemale: 'Parolière'
    })
    const dragonClasse: DBClasse = this.createClasse({
      name: 'dragon',
      displayMale: 'Dragon',
      displayFemale: 'Dragon',
      apotheoses: [
        apotheoses.get('apotheose'),
        apotheoses.get('apotheose améliorée'),
        apotheoses.get('apotheose finale')
      ]
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
    return newClasses
  }
  static createClasse(p: {
    name: string
    displayMale: string
    displayFemale: string
    apotheoses?: DBApotheose[]
    skills?: DBSkill[]
    proficiencies?: DBProficiency[]
    canUsePp?: boolean
  }): DBClasse {
    const newClass = new DBClasse()
    newClass.name = p.name
    newClass.displayMale = p.displayMale
    newClass.displayFemale = p.displayFemale
    newClass.apotheoses = p.apotheoses || []
    newClass.skills = p.skills || []
    newClass.proficiencies = p.proficiencies || []
    newClass.canUsePp = p.canUsePp
    return newClass
  }
}
