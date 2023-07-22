import { IHomePageResponse } from './IHomePageResponse'

export interface IHomePageProvider {
  getHomePage(): Promise<IHomePageResponse>
}
