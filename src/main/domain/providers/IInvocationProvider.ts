import { Invocation, InvocationToCreate } from '../models/invocation/Invocation'
import { InvocationTemplate } from '../models/invocation/InvocationTemplate'

export interface IInvocationProvider {
  create(Invocation: InvocationToCreate): Promise<Invocation>

  update(Invocation: Invocation): Promise<Invocation>

  delete(name: string): Promise<boolean>

  getById(invocationId: string): Promise<Invocation>

  findAll(summonerName: string): Promise<Invocation[]>

  findTemplateByName(invocationName: string): Promise<InvocationTemplate>
}
