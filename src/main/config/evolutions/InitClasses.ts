import { DBClasse } from '../../data/database/classes/DBClasse'
import { Injectable } from '@nestjs/common'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class InitClasses {
  static getClasses(): DBClasse[] {
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
      name: 'rejete',
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
    return newClasses
  }
  static createClasse(p: { name: string; displayMale: string; displayFemale: string }): DBClasse {
    const newClass = new DBClasse()
    newClass.name = p.name
    newClass.displayMale = p.displayMale
    newClass.displayFemale = p.displayFemale
    return newClass
  }
}
