import { ModelMessage } from '../../models/elena/ModelMessage'

export interface IModelMessageProvider {
  findOneById(modelMessageId: string): Promise<ModelMessage>
}
