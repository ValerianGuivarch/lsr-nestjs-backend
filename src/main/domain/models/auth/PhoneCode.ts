export enum PhoneCodeStatus {
  CREATED = 'CREATED',
  USED = 'USED',
  EXPIRED = 'EXPIRED'
}

export class PhoneCode {
  id: string
  accountId: string
  code: string
  status: PhoneCodeStatus
  createdDate: Date

  constructor(p: PhoneCode) {
    this.id = p.id
    this.accountId = p.accountId
    this.code = p.code
    this.status = p.status
    this.createdDate = p.createdDate
  }
}

export type PhoneCodeToCreate = Omit<PhoneCode, 'id' | 'createdDate'>
