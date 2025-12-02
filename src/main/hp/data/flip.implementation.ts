import { DBFlip } from './flip.db'
import { ProviderErrors } from '../../data/errors/ProviderErrors'
import { Flip, FlipToCreate } from '../domain/entities/flip.entity'
import { IFlipProvider } from '../domain/providers/flip.provider'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class FlipImplementation implements IFlipProvider {
  constructor(
    @InjectRepository(DBFlip, 'postgres')
    private readonly flipRepository: Repository<DBFlip>
  ) {}

  async create(flip: FlipToCreate): Promise<Flip> {
    const toCreate = {
      createdDate: new Date(),
      updatedDate: new Date(),
      wizardName: flip.wizardName,
      wizardDisplayName: flip.wizardDisplayName,
      text: flip.text,
      result: flip.result,
      baseBis: flip.baseBis,
      modif: flip.modif,
      base: flip.base,
      difficulty: flip.difficulty,
      success: flip.success,
      xpOk: false,
      statId: flip.statId,
      knowledgeId: flip.knowledgeId,
      spellId: flip.spellId
    }
    return this.flipRepository.save(toCreate).then(DBFlip.toFlip)
  }

  async update(
    id: string,
    update: {
      xpOk: boolean
    }
  ): Promise<void> {
    const flip = await this.flipRepository.findOne({
      where: {
        id: id
      }
    })
    if (!flip) {
      throw ProviderErrors.EntityNotFound(DBFlip.name)
    }
    flip.xpOk = update.xpOk
    await this.flipRepository.save(flip)
  }

  async findById(id: string): Promise<Flip> {
    const flip = await this.flipRepository.findOne({
      where: {
        id: id
      },
      relations: DBFlip.RELATIONS
    })
    if (!flip) {
      throw ProviderErrors.EntityNotFound(DBFlip.name)
    }
    return DBFlip.toFlip(flip)
  }

  async findAll(): Promise<Flip[]> {
    return (
      (
        await this.flipRepository.find({
          relations: DBFlip.RELATIONS
        })
      )
        .sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime())
        //inverse
        .reverse()
        .map(DBFlip.toFlip)
    )
  }
}
