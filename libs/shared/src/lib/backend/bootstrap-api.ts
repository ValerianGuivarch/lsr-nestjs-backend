import multipart from '@fastify/multipart'
import { Type, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

interface BootstrapApiOptions {
  rootModule: Type<object>
  appName: string
  swaggerTag: string
  swaggerPath: string
  portEnvKey: string
  beforeListen?: (app: NestFastifyApplication) => Promise<void> | void
}

function parsePort(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value)

    if (Number.isNaN(parsed)) {
      return undefined
    }

    return parsed
  }

  return undefined
}

export async function bootstrapApi(p: BootstrapApiOptions): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(p.rootModule, new FastifyAdapter(), {
    logger: ['error', 'warn', 'log']
  })

  app.enableCors({
    origin: ['https://photos.mariage-mickael-valerian.fr', 'https://l7r.fr', 'http://localhost:3000'],
    credentials: false
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  const config = new DocumentBuilder()
    .setTitle(`${p.appName} swagger`)
    .setDescription(`${p.appName} API swagger`)
    .setVersion('1.0')
    .addTag(p.swaggerTag)
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup(p.swaggerPath, app, document)

  await app.register(multipart, {
    limits: { fileSize: 12 * 1024 * 1024 }
  })

  await p.beforeListen?.(app)

  const configService = app.get(ConfigService)
  const host = configService.get<string>('HOST') ?? configService.get<string>('http.host') ?? '0.0.0.0'
  const candidatePort =
    parsePort(configService.get<string>(p.portEnvKey)) ??
    parsePort(configService.get<number>('PORT')) ??
    parsePort(configService.get<number>('http.port'))

  if (candidatePort === undefined) {
    throw new Error(`No valid port found for ${p.appName}. Set ${p.portEnvKey} or PORT.`)
  }

  await app.listen(candidatePort, host)
}