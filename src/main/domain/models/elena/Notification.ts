export class Notification {
  titre: string
  text: string
  pictureUrl?: string

  constructor(p: Notification) {
    this.titre = p.titre
    this.text = p.text
    this.pictureUrl = p.pictureUrl
  }
}
