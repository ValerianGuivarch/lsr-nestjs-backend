import { Inject, Injectable } from '@nestjs/common'
import { Stat } from './Stat'
import { IStatProvider } from './ports/IStatProvider'

@Injectable()
export class StatService {
  constructor(@Inject('IStatProvider') private readonly statProvider: IStatProvider) {}

  add(jdrSlug: string, p: { name: string }): Promise<Stat> {
    return this.statProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, statSlug: string, p: { name: string }): Promise<Stat> {
    return this.statProvider.update(jdrSlug, statSlug, p)
  }

  remove(jdrSlug: string, statSlug: string): Promise<void> {
    return this.statProvider.remove(jdrSlug, statSlug)
  }
}
