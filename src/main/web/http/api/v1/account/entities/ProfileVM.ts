import { Profile } from '../../../../../../domain/models/account/Profile'
import { ApiProperty } from '@nestjs/swagger'

export class ProfileVM {
  @ApiProperty()
  id: string
  @ApiProperty()
  name: string

  private constructor(p: ProfileVM) {
    this.id = p.id
    this.name = p.name
  }

  static from(profile: Profile): ProfileVM {
    return new ProfileVM({
      id: profile.id,
      name: profile.name
    })
  }
}
