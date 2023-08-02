export class Invocation {
  id: string
  chair: number
  esprit: number
  essence: number
  pv: number
  pvMax: number
  summonerName: string
  typeId: string
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
    typeId: string
    summonerName: string
    picture?: string
    healer: boolean
  }): Promise<InvocationToCreate> {
    const defaults = {
      chair: p.chair,
      esprit: p.esprit,
      essence: p.essence,
      pv: p.pvMax,
      pvMax: p.pvMax,
      typeId: p.typeId,
      healer: p.healer
    }

    return Object.assign(defaults, p)
  }
}

export type InvocationToCreate = Omit<Invocation, 'id'>
