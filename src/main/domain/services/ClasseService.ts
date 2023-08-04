import { Classe } from '../models/characters/Classe'
import { IClasseProvider } from '../providers/IClasseProvider'
import { Inject, Logger } from '@nestjs/common'

export class ClasseService {
  private readonly logger = new Logger(ClasseService.name)

  constructor(
    @Inject('IClasseProvider')
    private classeProvider: IClasseProvider
  ) {
    console.log('ClasseService')
  }

  async findAll(): Promise<Classe[]> {
    return this.classeProvider.findAll()
  }

  async findOneByName(name: string): Promise<Classe> {
    return this.classeProvider.findOneByName(name)
  }
}
