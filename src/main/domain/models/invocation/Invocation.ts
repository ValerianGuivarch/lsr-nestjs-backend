export class Invocation {
  id: string
  chair: number
  esprit: number
  essence: number
  pv: number
  pvMax: number
  summonerName: string
  templateName: string
  picture?: string
  healer: boolean

  constructor(p: InvocationToCreate) {
    Object.assign(this, p)
  }

  static async invocationToCreateFactory(p: {
    id: string
    chair: number
    esprit: number
    essence: number
    pvMax: number
    summonerName: string
    picture?: string
    healer: boolean
    templateName: string
  }): Promise<InvocationToCreate> {
    const defaults = {
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      pv: p.pvMax,
      pvMax: p.pvMax,
      templateName: p.templateName,
      healer: p.healer,
      summonerName: p.summonerName,
      picture: p.picture
    }

    return Object.assign(defaults, p)
  }
}

export type InvocationToCreate = Omit<Invocation, 'id'>
