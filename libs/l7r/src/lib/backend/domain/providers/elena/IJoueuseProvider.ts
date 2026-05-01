import { Joueuse, JoueuseToCreate, JoueuseToUpdate } from '../../models/elena/Joueuse'

export interface IJoueuseProvider {
  create(joueuse: JoueuseToCreate): Promise<Joueuse>
  findOneByName(name: string): Promise<Joueuse>
  update(p: { joueuseName: string; joueuse: Partial<JoueuseToUpdate> }): Promise<Joueuse>
  findAll(): Promise<Joueuse[]>
}
