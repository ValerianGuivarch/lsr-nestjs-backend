import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MediaController } from './media.controller'
import { MediaEntity } from './media.entity'
import { MediaService } from './media.service'

@Module({
  imports: [TypeOrmModule.forFeature([MediaEntity], 'jdr-sqlite')],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService]
})
export class MediaModule {}
