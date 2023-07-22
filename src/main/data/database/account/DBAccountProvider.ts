import { DBAccount } from './DBAccount'
import { filterNullAndUndefinedAndEmpty } from '../../../domain/helpers/ArraysHelpers'
import { Account } from '../../../domain/models/account/Account'
import { IAccountProvider } from '../../../domain/providers/account/IAccountProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'

@Injectable()
export class DBAccountProvider implements IAccountProvider {
  constructor(
    @InjectRepository(DBAccount, 'postgres')
    private readonly accountRepository: Repository<DBAccount>
  ) {
    console.log('DBAccountProvider')
  }

  private static toAccount(doc: DBAccount): Account {
    return new Account({
      id: doc.id,
      authority: doc.authority,
      secret: doc.secret,
      createdDate: doc.createdDate,
      updatedDate: doc.updatedDate
    })
  }

  private static fromAccount(doc: Account): DBAccount {
    return {
      secret: doc.secret,
      authority: doc.authority,
      createdDate: undefined,
      updatedDate: undefined
    } as DBAccount
  }

  async create(account: Account): Promise<Account> {
    const created = await this.accountRepository.save(
      DBAccountProvider.fromAccount({
        ...account
      })
    )
    return DBAccountProvider.toAccount(created)
  }

  async update(account: Account): Promise<Account> {
    const oldAccount = await this.accountRepository.findOneBy({
      id: account.id
    })
    if (!oldAccount) {
      throw ProviderErrors.EntityNotFound(Account.name)
    }
    return this.accountRepository.update(account.id, DBAccountProvider.fromAccount(account)).then((result) => {
      return account
    })
  }

  async findById(id: string): Promise<Account | undefined> {
    const account = await this.accountRepository.findOneBy({ id: id })
    if (!account) {
      return undefined
    }
    return DBAccountProvider.toAccount(account)
  }

  async countAll(): Promise<number> {
    return this.accountRepository.count()
  }

  async findAllByIdIn(ids: string[]): Promise<Account[]> {
    const results = await this.accountRepository.findBy({
      id: In(ids.filter(filterNullAndUndefinedAndEmpty()))
    })
    return results.map((entity) => DBAccountProvider.toAccount(entity))
  }

  async findAll(): Promise<Account[]> {
    const result = await this.accountRepository.find()
    return result.map((doc) => DBAccountProvider.toAccount(doc))
  }

  async findOneById(id: string): Promise<Account> {
    const account = await this.accountRepository.findOneBy({ id: id })
    if (!account) {
      return undefined
    }
    return DBAccountProvider.toAccount(account)
  }
}
