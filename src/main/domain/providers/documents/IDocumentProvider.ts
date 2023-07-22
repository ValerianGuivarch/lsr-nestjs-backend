import { IDocumentInformationResponse } from './IDocumentInformationResponse'

export interface IDocumentProvider {
  getDocumentInformationById(id: string): Promise<IDocumentInformationResponse>
}
