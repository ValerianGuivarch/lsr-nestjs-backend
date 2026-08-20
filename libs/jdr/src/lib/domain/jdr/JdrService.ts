import { Inject, Injectable } from '@nestjs/common'
import { Jdr } from './Jdr'
import { IJdrProvider } from './ports/IJdrProvider'

@Injectable()
export class JdrService {
  constructor(@Inject('IJdrProvider') private readonly jdrProvider: IJdrProvider) {}

  findAll(): Promise<Pick<Jdr, 'slug' | 'name'>[]> {
    return this.jdrProvider.findAll()
  }

  findOneBySlug(jdrSlug: string): Promise<Jdr> {
    return this.jdrProvider.findOneBySlug(jdrSlug)
  }

  create(p: { name: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.create(p)
  }

  update(jdrSlug: string, p: { name?: string; text?: string }): Promise<Jdr> {
    return this.jdrProvider.update(jdrSlug, p)
  }

  delete(jdrSlug: string): Promise<void> {
    return this.jdrProvider.delete(jdrSlug)
  }
}

