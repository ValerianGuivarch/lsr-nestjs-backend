import { PrismicHomePage } from './PrismicHomePage'
import { IHomePageProvider } from '../../../domain/providers/home_page/IHomePageProvider'
import { IHomePageResponse } from '../../../domain/providers/home_page/IHomePageResponse'
import { PrismicContentType } from '../PrismicContentType'
import { PrismicProvider } from '../PrismicProvider'
import { Injectable } from '@nestjs/common'

@Injectable()
export class PrismicHomePageProvider implements IHomePageProvider {
  constructor(private prismicProvider: PrismicProvider) {}

  static toHomePageResponse(prismicHomePage: PrismicHomePage): IHomePageResponse {
    return {
      id: prismicHomePage.id,
      promotedPracticeUid: prismicHomePage.promotedPracticeUid,
      videoTags: prismicHomePage.videoTags,
      duration: prismicHomePage.duration,
      uid: prismicHomePage.uid,
      weeklySchedule: prismicHomePage.weeklySchedule,
      milestone: prismicHomePage.milestone
    } as IHomePageResponse
  }

  async getHomePage(): Promise<IHomePageResponse> {
    const homePage = await this.prismicProvider.getSingleDocumentByContentTypeAndLang(
      PrismicContentType.HOME_PAGE,
      'fr-fr'
    )
    return PrismicHomePageProvider.toHomePageResponse(PrismicHomePage.createPrismicHomePage(homePage))
  }
}
