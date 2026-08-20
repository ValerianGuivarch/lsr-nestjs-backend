import { Inject, Injectable } from '@nestjs/common'
import { Trait } from './Trait'
import { ITraitProvider } from './ports/ITraitProvider'

@Injectable()
export class TraitService {
  constructor(@Inject('ITraitProvider') private readonly traitProvider: ITraitProvider) {}

  add(jdrSlug: string, p: Parameters<ITraitProvider['add']>[1]): Promise<Trait> {
    return this.traitProvider.add(jdrSlug, p)
  }

  update(jdrSlug: string, traitSlug: string, p: Parameters<ITraitProvider['update']>[2]): Promise<Trait> {
    return this.traitProvider.update(jdrSlug, traitSlug, p)
  }

  remove(jdrSlug: string, traitSlug: string): Promise<void> {
    return this.traitProvider.remove(jdrSlug, traitSlug)
  }
}
