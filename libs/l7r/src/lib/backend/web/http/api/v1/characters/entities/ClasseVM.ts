import { Classe } from '../../../../../../domain/models/characters/Classe'
import { Genre } from '../../../../../../domain/models/characters/Genre'
import { ApiProperty } from '@nestjs/swagger'

export class ClasseVM {
  @ApiProperty()
  name: string

  @ApiProperty()
  display: string

  @ApiProperty()
  canUsePp: boolean

  constructor(p: ClasseVM) {
    this.name = p.name
    this.display = p.display
    this.canUsePp = p.canUsePp
  }

  static of(p: { classe: Classe; genre: Genre }): ClasseVM {
    return new ClasseVM({
      name: p.classe.name,
      display: p.genre === Genre.HOMME ? p.classe.displayMale : p.classe.displayFemale,
      canUsePp: p.classe.canUsePp
    })
  }
}
