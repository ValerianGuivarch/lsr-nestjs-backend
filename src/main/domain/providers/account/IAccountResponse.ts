import { Authority } from '../../models/auth/Authority'
import { Document } from 'mongoose'

export interface IAccountResponse extends Document {
  readonly id: string
  readonly email: string
  readonly username: string
  readonly password: string
  readonly authority: Authority
  readonly secret: string
  readonly createdDate: Date
  readonly updatedDate: Date
}
