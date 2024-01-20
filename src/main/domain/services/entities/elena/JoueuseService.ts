import { Joueuse, JoueuseToCreate, JoueuseToUpdate } from '../../../models/elena/Joueuse'
import { IJoueuseProvider } from '../../../providers/elena/IJoueuseProvider'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class JoueuseService {
  constructor(@Inject('IJoueuseProvider') private readonly joueuseProvider: IJoueuseProvider) {}

  async create(joueuse: JoueuseToCreate): Promise<Joueuse> {
    return await this.joueuseProvider.create(joueuse)
  }

  async findOneByName(name: string): Promise<Joueuse> {
    return await this.joueuseProvider.findOneByName(name)
  }

  async update(p: { joueuseName: string; joueuse: Partial<JoueuseToUpdate> }): Promise<Joueuse> {
    return await this.joueuseProvider.update(p)
  }

  async findAll(): Promise<Joueuse[]> {
    return await this.joueuseProvider.findAll()
  }
}
