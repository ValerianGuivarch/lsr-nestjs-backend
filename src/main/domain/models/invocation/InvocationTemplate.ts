import { InvocationToCreate } from './Invocation'
import { InvocationReferential } from './InvocationReferential'

export class InvocationTemplate {
  name: string
  chairValueReferential: InvocationReferential
  chairValueRule: number
  espritValueReferential: InvocationReferential
  espritValueRule: number
  essenceValueReferential: InvocationReferential
  essenceValueRule: number
  pvMaxValueReferential: InvocationReferential
  pvMaxValueRule: number
  healer: boolean
  picture?: string

  constructor(p: InvocationToCreate) {
    Object.assign(this, p)
  }
}
