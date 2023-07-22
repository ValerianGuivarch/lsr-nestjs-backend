import { Profile } from '../../models/account/Profile'

export interface IProfileProvider {
  create(profile: Profile): Promise<Profile>
  update(profile: Profile): Promise<Profile>
  findOneByAccountId(accountId: string): Promise<Profile>
  findOneById(id: string): Promise<Profile>
  findAllByIdIn(ids: string[]): Promise<Profile[]>
  delete(id: string): Promise<Profile>
}
