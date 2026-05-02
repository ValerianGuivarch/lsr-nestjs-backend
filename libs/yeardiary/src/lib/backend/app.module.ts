import config from './config/configuration'
import { SQLiteModule } from './data/database/sqlite.module'
import { DiaryService } from './domain/services/entities/diaries/DiaryService'
import { DiaryController } from './web/http/api/v1/diaries/DiaryController'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config]
    }),
    SQLiteModule
  ],
  controllers: [DiaryController],
  providers: [DiaryService]
})
export class AppModule {}
