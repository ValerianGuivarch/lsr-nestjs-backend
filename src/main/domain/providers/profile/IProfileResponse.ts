import { Document } from 'mongoose'

export interface IProfileResponse extends Document {
  id: string
  accountId: string
  createdDate: Date
  updatedDate: Date
}
