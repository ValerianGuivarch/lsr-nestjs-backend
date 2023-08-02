import { Invocation, InvocationToCreate } from '../models/invocation/Invocation'
import { InvocationType } from '../models/invocation/InvocationType'

export interface IInvocationProvider {
  create(Invocation: InvocationToCreate): Promise<Invocation>

  update(Invocation: Invocation): Promise<Invocation>

  delete(name: string): Promise<boolean>

  findAll(summonerName: string): Promise<Invocation[]>

  findTypeByName(invocationName: string): Promise<InvocationType>
}
