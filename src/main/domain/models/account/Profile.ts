export class Profile {
  id: string
  name: string
  accountId: string
  createdDate: Date
  updatedDate: Date

  constructor(p: Partial<Profile>) {
    this.id = p.id ?? ''
    this.name = p.name ?? ''
    this.accountId = p.accountId ?? ''
    this.createdDate = p.createdDate ?? new Date()
    this.updatedDate = p.updatedDate ?? new Date()
  }
}
