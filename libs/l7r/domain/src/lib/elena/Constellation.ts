export class Constellation {
  id: string
  name: string
  realName: string
  pictureUrl: string
  pictureUrlRevealed: string
  revealed: boolean
  isStarStream: boolean
  sponsor: boolean

  constructor(p: {
    id: string
    name: string
    realName: string
    pictureUrl: string
    pictureUrlRevealed: string
    revealed: boolean
    isStarStream: boolean
    sponsor: boolean
  }) {
    this.id = p.id
    this.name = p.name
    this.realName = p.realName
    this.pictureUrl = p.pictureUrl
    this.pictureUrlRevealed = p.pictureUrlRevealed
    this.revealed = p.revealed
    this.isStarStream = p.isStarStream
    this.sponsor = p.sponsor
  }

  static toConstellationToCreate(p: {
    name: string
    realName: string
    pictureUrl: string
    pictureUrlRevealed: string
    isStarStream: boolean
    sponsor: boolean
  }): ConstellationToCreate {
    return {
      name: p.name,
      realName: p.realName,
      pictureUrl: p.pictureUrl,
      pictureUrlRevealed: p.pictureUrlRevealed,
      revealed: false,
      isStarStream: p.isStarStream,
      sponsor: p.sponsor
    }
  }
}

export type ConstellationToCreate = Omit<Constellation, 'id'>
