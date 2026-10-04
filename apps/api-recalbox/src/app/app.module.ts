import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthController } from '../auth/auth.controller'
import { AuthGuard } from '../auth/auth.guard'
import { AuthService } from '../auth/auth.service'
import { RecalboxController } from '../recalbox/recalbox.controller'

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AuthController, RecalboxController],
  providers: [AuthService, AuthGuard]
})
export class AppModule {}
