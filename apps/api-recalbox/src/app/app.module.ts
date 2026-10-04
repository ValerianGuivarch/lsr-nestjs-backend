import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from '../auth/auth.controller'
import { AuthGuard } from '../auth/auth.guard'
import { AuthService } from '../auth/auth.service'
import { RecalboxController } from '../recalbox/recalbox.controller'
import { RecalboxService } from '../recalbox/recalbox.service'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AuthController, RecalboxController],
  providers: [AuthService, AuthGuard, RecalboxService]
})
export class AppModule {}
