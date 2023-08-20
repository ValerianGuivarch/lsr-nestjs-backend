import { INameProvider } from '../../domain/providers/INameProvider'
import { Injectable } from '@nestjs/common'
import axios from 'axios'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class BTNNameProvider implements INameProvider {
  async generateName(): Promise<string> {
    const BTN_API_KEY = process.env.BTN_API_KEY
    const BTN_BASE_URL = process.env.BTN_BASE_URL

    try {
      const response = await axios.get(BTN_BASE_URL, {
        params: {
          key: BTN_API_KEY
        }
      })

      if (response.data && response.data.names && response.data.names.length > 0) {
        console.log(response.data.names[0])
        return response.data.names[0]
      } else {
        console.log('Pas de nom généré')
        return 'Pas de nom généré'
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du nom', error)
      return 'Erreur lors de la récupération du nom'
    }
  }
}
