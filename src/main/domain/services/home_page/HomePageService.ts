import { DomainErrors } from '../../errors/DomainErrors'
import { HomePage } from '../../models/home_page/HomePage'
import { IHomePageProvider } from '../../providers/home_page/IHomePageProvider'
import { Inject, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class HomePageService {
  private readonly logger = new Logger(HomePageService.name)
  constructor(
    @Inject('IHomePageProvider')
    private homePageProvider: IHomePageProvider
  ) {}

  async getHomePage(): Promise<HomePage> {
    try {
      const homePageResponse = await this.homePageProvider.getHomePage()
      return new HomePage({
        duration: homePageResponse.duration,
        id: homePageResponse.id,
        milestone: homePageResponse.milestone,
        weeklySchedule: homePageResponse.weeklySchedule,
        uid: homePageResponse.uid,
        promotedPracticeUid: homePageResponse.promotedPracticeUid,
        videoTags: homePageResponse.videoTags
      })
    } catch (e) {
      throw DomainErrors.FindHomePageFailed()
    }
  }
}
