import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app/app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const port = Number(process.env['RECALBOX_API_PORT'] ?? 3335)
  const host = process.env['HOST'] ?? '0.0.0.0'

  await app.listen(port, host)
  Logger.log(`Recalbox API listening on ${host}:${port}`)
}

bootstrap()
