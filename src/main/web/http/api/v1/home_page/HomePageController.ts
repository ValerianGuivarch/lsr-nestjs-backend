import { HomePageService } from '../../../../../domain/services/home_page/HomePageService'
import { Public } from '../../decorators/PublicDecorator'
import { Controller, Get, HttpCode, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger'

@Controller('api/v1/:lang/home-page')
@Public()
@ApiTags('Home-Page')
export class HomePageController {
  private readonly logger = new Logger(HomePageController.name)
  constructor(private homePageService: HomePageService) {}

  @ApiBearerAuth()
  @ApiOkResponse()
  @HttpCode(HttpStatus.OK)
  @Get()
  async getHomePage(): Promise<void> {
    const homePage = await this.homePageService.getHomePage()
    if (!homePage) {
      throw new HttpException({ status: HttpStatus.NOT_FOUND }, HttpStatus.NOT_FOUND)
    }
  }
}
