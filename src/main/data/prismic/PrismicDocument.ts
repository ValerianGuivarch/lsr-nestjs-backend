import { Lang } from './Lang'

export abstract class PrismicDocument {
  id: string
  title: string
  lang: Lang

  protected constructor(id: string, title: string, lang: string) {
    this.id = id
    this.title = title
    this.lang = Lang[lang]
  }
}
