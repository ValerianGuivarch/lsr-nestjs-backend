import { Pokemon } from '../models/invocation/Pokemon'

export interface IPokeProvider {
  getPokemonById(id: number): Promise<Pokemon>
}
