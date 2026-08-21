import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppYearDiaryModule } from '../../libs/yeardiary/src/lib/backend/app-yeardiary.module'
import { JdrModule } from 'jdr'
import configuration from '../../libs/shared/src/lib/backend/configuration'
import { ConfigController } from './config.controller'

function envEnabled(key: string, defaultValue: boolean): boolean {
  const raw = process.env[key]

  if (raw === undefined) {
    return defaultValue
  }

  const normalized = raw.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

const enableJdr = envEnabled('ENABLE_JDR', true)
const enableYearDiary = envEnabled('ENABLE_YEARDIARY', true)

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    ...(enableJdr ? [JdrModule] : []),
    ...(enableYearDiary ? [AppYearDiaryModule] : [])
  ],
  controllers: [ConfigController]
})
export class AppUnifiedModule {}
