import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { JdrClass } from '../../domain/classes/JdrClass'
import { ClassResourceProfile } from '../../domain/classes/ClassResourceProfile'
import { IClassProvider } from '../../domain/classes/ports/IClassProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrClass } from './database/jdr-class.db'
import { DBJdrClassResource } from './database/jdr-class-resource.db'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { ClassMapper } from './ClassMapper'

@Injectable()
export class ClassProvider implements IClassProvider {
  constructor(
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>,
    @InjectRepository(DBJdrClassResource, 'jdr-sqlite') private readonly classResourceRepo: Repository<DBJdrClassResource>,
    @InjectRepository(DBJdrCharacter, 'jdr-sqlite') private readonly characterRepo: Repository<DBJdrCharacter>
  ) {}

  async add(jdrSlug: string, p: { name: string; level: number; text?: string }): Promise<JdrClass> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.classRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Class '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.classRepo.save(
      this.classRepo.create({ jdrSlug, slug, name: p.name, text: p.text ?? '', level: p.level })
    )
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(jdrSlug: string, classSlug: string, p: { name?: string; level?: number; text?: string }): Promise<JdrClass> {
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.level !== undefined) updates.level = p.level
    if (p.text !== undefined) updates.text = p.text
    if (Object.keys(updates).length > 0) {
      await this.classRepo.update({ jdrSlug, slug: classSlug }, updates)
    }
    return this.findOneOrThrow(jdrSlug, classSlug)
  }

  async remove(jdrSlug: string, classSlug: string): Promise<void> {
    await this.classRepo.delete({ jdrSlug, slug: classSlug })
    await this.classResourceRepo.delete({ jdrSlug, classSlug })
    await this.characterRepo.update({ jdrSlug, classSlug }, { classSlug: null })
  }

  async addClassResource(jdrSlug: string, classSlug: string, p: { resourceSlug: string; resourceType: string; defaultValue?: number; behavior?: string }): Promise<ClassResourceProfile> {
    const clazz = await this.classRepo.findOne({ where: { jdrSlug, slug: classSlug } })
    if (!clazz) throw JdrError.notFound(`Class '${classSlug}'`)
    const existing = await this.classResourceRepo.findOne({ where: { jdrSlug, classSlug, resourceSlug: p.resourceSlug } })
    if (existing) throw JdrError.conflict(`ClassResource '${p.resourceSlug}' already exists on class '${classSlug}'`)
    const saved = await this.classResourceRepo.save(
      this.classResourceRepo.create({
        jdrSlug,
        classSlug,
        resourceSlug: p.resourceSlug,
        resourceType: p.resourceType,
        defaultValue: p.defaultValue ?? 0,
        behavior: (p.behavior ?? 'fixed') as 'fixed' | 'scalable'
      })
    )
    return ClassMapper.toResourceProfile(saved)
  }

  async removeClassResource(jdrSlug: string, classSlug: string, resourceSlug: string): Promise<void> {
    await this.classResourceRepo.delete({ jdrSlug, classSlug, resourceSlug })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<JdrClass> {
    const db = await this.classRepo.findOne({ where: { jdrSlug, slug }, relations: DBJdrClass.RELATIONS })
    if (!db) throw JdrError.notFound(`Class '${slug}'`)
    return ClassMapper.toDomain(db)
  }
}
