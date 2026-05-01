import { WeddingPhotosController } from './wedding-photos.controller'
import { WeddingPhotosService } from './wedding-photos.service'
import { Module } from '@nestjs/common'

@Module({
  controllers: [WeddingPhotosController],
  providers: [WeddingPhotosService]
})
export class WeddingPhotosModule {}
