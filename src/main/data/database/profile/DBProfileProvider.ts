import { DBProfile } from './DBProfile'
import { filterNullAndUndefinedAndEmpty } from '../../../domain/helpers/ArraysHelpers'
import { Profile } from '../../../domain/models/account/Profile'
import { IProfileProvider } from '../../../domain/providers/IProfileProvider'
import { ProviderErrors } from '../../errors/ProviderErrors'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'

@Injectable()
export class DBProfileProvider implements IProfileProvider {
  constructor(
    @InjectRepository(DBProfile, 'postgres')
    private readonly profileRepository: Repository<DBProfile>
  ) {
    console.log('DBPostgresProfileProvider')
  }
  private static toProfile(doc: DBProfile): Profile {
    return new Profile({
      id: doc.id.toString(),
      name: doc.name,
      accountId: doc.accountId,
      createdDate: doc.createdDate,
      updatedDate: doc.updatedDate
    })
  }

  private static fromProfile(profile: Profile): DBProfile {
    return {
      accountId: profile.accountId,
      name: profile.name,
      createdDate: profile.createdDate,
      updatedDate: new Date()
    } as DBProfile
  }

  async create(profile: Profile): Promise<Profile> {
    const created = await this.profileRepository.create(DBProfileProvider.fromProfile(profile))
    await this.profileRepository.insert(created)
    return DBProfileProvider.toProfile(created)
  }

  async findOneByAccountId(accountId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOneBy({
      accountId: accountId
    })
    if (!profile) {
      throw ProviderErrors.EntityNotFound(Profile.name)
    }
    return DBProfileProvider.toProfile(profile)
  }

  async findOneById(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOneBy({
      id: id
    })
    if (!profile) {
      throw ProviderErrors.EntityNotFound(Profile.name)
    }
    return DBProfileProvider.toProfile(profile)
  }

  async update(profile: Profile): Promise<Profile> {
    const result = await this.profileRepository.update({ id: profile.id }, DBProfileProvider.fromProfile(profile))
    return DBProfileProvider.toProfile(
      await this.profileRepository.findOneBy({
        id: profile.id
      })
    )
  }

  async findAllByIdIn(ids: string[]): Promise<Profile[]> {
    const results = await this.profileRepository.findBy({
      id: In(ids.filter(filterNullAndUndefinedAndEmpty()))
    })
    return results.map((entity) => DBProfileProvider.toProfile(entity))
  }

  async delete(id: string): Promise<void> {
    const profile = await this.profileRepository.delete({ id: id })
    if (!profile) {
      throw ProviderErrors.EntityNotFound(Profile.name)
    }
  }
}
