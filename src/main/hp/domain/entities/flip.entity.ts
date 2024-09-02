export class Flip {
  id: string
  wizardName: string
  text: string

  constructor(flip: { id: string; text: string; wizardName: string }) {
    this.id = flip.id
    this.wizardName = flip.wizardName
    this.text = flip.text
  }

  static toFlipToCreate(p: { wizardName: string; text: string }): FlipToCreate {
    return {
      wizardName: p.wizardName,
      text: p.text
    }
  }
}

export type FlipToCreate = Omit<Flip, 'id'>
