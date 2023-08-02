import { InvocationToCreate } from './Invocation'
import { InvocationReferential } from './InvocationReferential'
import { Bloodline } from '../characters/Bloodline'

export class InvocationType {
  name: string
  bloodlines: Bloodline[]
  chairValueReferential: InvocationReferential
  chairValueRule: number
  espritValueReferential: InvocationReferential
  espritValueRule: number
  essenceValueReferential: InvocationReferential
  essenceValueRule: number
  pvMaxValueReferential: InvocationReferential
  pvMaxValueRule: number
  healer: boolean
  picture: string

  constructor(p: InvocationToCreate) {
    Object.assign(this, p)
  }
}
