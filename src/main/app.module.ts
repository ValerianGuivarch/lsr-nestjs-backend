import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import configuration from '../../libs/shared/src/lib/backend/configuration'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    })
  ]
})
export class AppModule {}
