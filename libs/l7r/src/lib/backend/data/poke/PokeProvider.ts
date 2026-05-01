import { Pokemon } from '../../domain/models/invocation/Pokemon'
import { IPokeProvider } from '../../domain/providers/IPokeProvider'
import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class PokeProvider implements IPokeProvider {
  private readonly BASE_URL = 'https://api-pokemon-fr.vercel.app/api/v1'

  async getPokemonById(id: number): Promise<Pokemon> {
    const response = await axios.get(`${this.BASE_URL}/pokemon/${id}`)

    return new Pokemon({
      nameFr: response.data.name.fr,
      imageUrl: response.data.sprites.regular
    })
  }
}
