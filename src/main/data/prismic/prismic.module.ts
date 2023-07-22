import { PrismicHomePageProvider } from './home-page/PrismicHomePageProvider'
import { PrismicProvider } from './PrismicProvider'
import { CacheModule } from '@nestjs/cache-manager'
import { Module } from '@nestjs/common'

@Module({
  imports: [CacheModule.register()],
  providers: [
    PrismicProvider,
    {
      provide: 'IDocumentProvider',
      useClass: PrismicProvider
    },
    {
      provide: 'IHomePageProvider',
      useClass: PrismicHomePageProvider
    }
  ],
  exports: [
    {
      provide: 'IDocumentProvider',
      useClass: PrismicProvider
    },
    {
      provide: 'IHomePageProvider',
      useClass: PrismicHomePageProvider
    }
  ]
})
export class PrismicModule {}
