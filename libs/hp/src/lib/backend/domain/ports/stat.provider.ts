import { Stat } from '../entities/stat.entity'

export interface IStatProvider {
  findAll(): Promise<Stat[]>
}
