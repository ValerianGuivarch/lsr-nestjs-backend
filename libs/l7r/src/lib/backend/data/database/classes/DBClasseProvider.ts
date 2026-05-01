import { DBClasse } from './DBClasse'
import { Classe } from '../../../domain/models/characters/Classe'
import { IClasseProvider } from '../../../domain/providers/IClasseProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common' // adjust the path as needed
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
// eslint-disable-next-line @darraghor/nestjs-typed/injectable-should-be-provided
export class DBClasseProvider implements IClasseProvider {
  constructor(
    @InjectRepository(DBClasse, 'postgres')
    private dbClasseRepository: Repository<DBClasse>
  ) {}

  private static toClasse(doc: DBClasse): Classe {
    return new Classe({
      name: doc.name,
      displayMale: doc.displayMale,
      displayFemale: doc.displayFemale,
      canUsePp: doc.canUsePp
    })
  }

  private static fromClasse(doc: Classe): DBClasse {
    return {
      name: doc.name,
      displayMale: doc.displayMale,
      displayFemale: doc.displayFemale,
      canUsePp: doc.canUsePp
    } as DBClasse
  }

  async findOneByName(name: string): Promise<Classe> {
    const classe = await this.dbClasseRepository.findOneBy({ name: name })
    if (!classe) {
      throw ProviderErrors.EntityNotFound(name)
    }
    return DBClasseProvider.toClasse(classe)
  }
  async findAll(): Promise<Classe[]> {
    const classes = (await this.dbClasseRepository.find()).sort((a, b) => a.name.localeCompare(b.name))
    return classes.map(DBClasseProvider.toClasse)
  }
}
