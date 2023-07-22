import { Authority } from './Authority'

export class Authentication {
  authority: Authority
  issuedAt: Date
  expiresAt: Date
  subject: string
  isRefreshToken = false

  constructor(p: Authentication) {
    this.authority = p.authority
    this.issuedAt = p.issuedAt
    this.expiresAt = p.expiresAt
    this.subject = p.subject
    this.isRefreshToken = p.isRefreshToken
  }
}
