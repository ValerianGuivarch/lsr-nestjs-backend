import { DBFlip } from './flip.db'
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
      text: flip.text,
      result: flip.result,
      baseBis: flip.baseBis,
      modif: flip.modif,
      base: flip.base,
      difficulty: flip.difficulty
    }
    return this.flipRepository.save(toCreate).then(DBFlip.toFlip)
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
