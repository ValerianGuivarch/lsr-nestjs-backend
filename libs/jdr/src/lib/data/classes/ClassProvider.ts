import { Injectable } from '@nestjs/common'
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Slug } from '../../domain/shared/Slug'
import { JdrError } from '../../domain/shared/JdrError'
import { JdrClass } from '../../domain/classes/JdrClass'
import { IClassProvider } from '../../domain/classes/ports/IClassProvider'
import { DBJdr } from '../jdr/database/DBJdr'
import { DBJdrClass } from './database/jdr-class.db'
import { DBJdrCharacter } from '../characters/database/jdr-character.db'
import { ClassMapper } from './ClassMapper'

@Injectable()
export class ClassProvider implements IClassProvider {
  constructor(
    @InjectDataSource('jdr-sqlite') private readonly dataSource: DataSource,
    @InjectRepository(DBJdr, 'jdr-sqlite') private readonly jdrRepo: Repository<DBJdr>,
    @InjectRepository(DBJdrClass, 'jdr-sqlite') private readonly classRepo: Repository<DBJdrClass>
  ) {}

  async add(jdrSlug: string, p: { name: string; levels?: string[]; text?: string }): Promise<JdrClass> {
    await this.ensureJdrExists(jdrSlug)
    const slug = Slug.from(p.name)
    const existing = await this.classRepo.findOne({ where: { jdrSlug, slug } })
    if (existing) throw JdrError.conflict(`Class '${slug}' already exists in jdr '${jdrSlug}'`)
    await this.classRepo.save(
      this.classRepo.create({ jdrSlug, slug, name: p.name, text: p.text ?? '', levels: p.levels ?? [] })
    )
    return this.findOneOrThrow(jdrSlug, slug)
  }

  async update(
    jdrSlug: string,
    classSlug: string,
    p: { name?: string; levels?: string[]; text?: string }
  ): Promise<JdrClass> {
    if (p.levels !== undefined) {
      const characters = await this.dataSource.getRepository(DBJdrCharacter).findBy({ jdrSlug, classSlug })
      const removedLevel = characters.find(
        (character) => character.classLevel !== null && !p.levels!.includes(character.classLevel)
      )?.classLevel
      if (removedLevel)
        throw JdrError.conflict(`Level '${removedLevel}' is still used by a character of class '${classSlug}'`)
    }
    const updates: Record<string, unknown> = {}
    if (p.name !== undefined) updates.name = p.name
    if (p.levels !== undefined) updates.levels = p.levels
    if (p.text !== undefined) updates.text = p.text
    if (Object.keys(updates).length > 0) {
      await this.classRepo.update({ jdrSlug, slug: classSlug }, updates)
    }
    return this.findOneOrThrow(jdrSlug, classSlug)
  }

  async remove(jdrSlug: string, classSlug: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(DBJdrCharacter)
        .update({ jdrSlug, classSlug }, { classSlug: null, classLevel: null })
      await manager.getRepository(DBJdrClass).delete({ jdrSlug, slug: classSlug })
    })
  }

  private async ensureJdrExists(jdrSlug: string): Promise<void> {
    const jdr = await this.jdrRepo.findOne({ where: { slug: jdrSlug } })
    if (!jdr) throw JdrError.notFound(`Jdr ${jdrSlug}`)
  }

  private async findOneOrThrow(jdrSlug: string, slug: string): Promise<JdrClass> {
    const db = await this.classRepo.findOne({ where: { jdrSlug, slug } })
    if (!db) throw JdrError.notFound(`Class '${slug}'`)
    return ClassMapper.toDomain(db)
  }
}
