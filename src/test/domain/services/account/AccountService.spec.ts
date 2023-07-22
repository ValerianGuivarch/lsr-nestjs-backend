import { IAccountProvider } from '../../../../main/domain/providers/IAccountProvider'
import { IProfileProvider } from '../../../../main/domain/providers/IProfileProvider'
import { AccountService } from '../../../../main/domain/services/account/AccountService'
import { TestAccountHelpers } from '../../../helpers/models/TestAccountHelpers'
import { TestCompanyHelpers } from '../../../helpers/models/TestCompanyHelpers'
import { Test } from '@nestjs/testing'

it('can create an instance of AccountService', async () => {
  // Create a fake copy of the IAccountProvider interface
  const fakeAccountProvider: Partial<IAccountProvider> = {}
  const fakeProfileProvider: Partial<IProfileProvider> = {}
  const module = await Test.createTestingModule({
    providers: [
      AccountService,
      {
        provide: 'IAccountProvider',
        useValue: fakeAccountProvider
      },
      {
        provide: 'IProfileProvider',
        useValue: fakeProfileProvider
      }
    ]
  }).compile()

  const service = module.get(AccountService)
  expect(service).toBeInstanceOf(AccountService)
})

it('findByName', async () => {
  const company = TestCompanyHelpers.generateCompany()
  const fakeAccountProvider: Partial<IAccountProvider> = {
    findByName: jest.fn().mockResolvedValue(company)
  }
  const fakeProfileProvider: Partial<IProfileProvider> = {}
  const module = await Test.createTestingModule({
    providers: [
      AccountService,
      {
        provide: 'IAccountProvider',
        useValue: fakeAccountProvider
      },
      {
        provide: 'IProfileProvider',
        useValue: fakeProfileProvider
      }
    ]
  }).compile()

  const service = module.get(AccountService)
  expect(service).toBeInstanceOf(AccountService)
  const result = await service.findByName(company.name)
  expect(result).toEqual(company)
})

it('updateAccount', async () => {
  const account = TestAccountHelpers.generateAccount()
  const accountUpdate = TestAccountHelpers.updateAccount(account)
  const fakeAccountProvider: Partial<IAccountProvider> = {
    update: jest.fn().mockResolvedValue(accountUpdate)
  }
  const fakeProfileProvider: Partial<IProfileProvider> = {}
  const module = await Test.createTestingModule({
    providers: [
      AccountService,
      {
        provide: 'IAccountProvider',
        useValue: fakeAccountProvider
      },
      {
        provide: 'IProfileProvider',
        useValue: fakeProfileProvider
      }
    ]
  }).compile()

  const service = module.get(AccountService)
  expect(service).toBeInstanceOf(AccountService)
  const result = await service.updateAccount({ account: account, accountUpdate: accountUpdate })
  expect(result.id).toEqual(account.id)
  expect(result.name).toEqual(accountUpdate.name)
})
it('findOneAccountById', async () => {
  const account = TestAccountHelpers.generateAccount()
  const fakeAccountProvider: Partial<IAccountProvider> = {
    findById: jest.fn().mockResolvedValue(account)
  }
  const fakeProfileProvider: Partial<IProfileProvider> = {}
  const module = await Test.createTestingModule({
    providers: [
      AccountService,
      {
        provide: 'IAccountProvider',
        useValue: fakeAccountProvider
      },
      {
        provide: 'IProfileProvider',
        useValue: fakeProfileProvider
      }
    ]
  }).compile()

  const service = module.get(AccountService)
  expect(service).toBeInstanceOf(AccountService)
  const result = await service.findOneAccountById(account.id)
  expect(result).toEqual(account)
})
