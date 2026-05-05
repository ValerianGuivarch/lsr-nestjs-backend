import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import multipart from '@fastify/multipart'
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify'
import { Type, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

interface ReverseProxyRule {
  sourcePrefix: string
  targetOrigin: string
  excludePrefixes?: string[]
}

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

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

function matchesProxyRule(pathname: string, rule: ReverseProxyRule): boolean {
  if (!matchesPrefix(pathname, rule.sourcePrefix)) {
    return false
  }

  return !(rule.excludePrefixes ?? []).some((prefix) => matchesPrefix(pathname, prefix))
}

export function registerReverseProxy(app: NestFastifyApplication, rules: ReverseProxyRule[]): void {
  const fastify = app.getHttpAdapter().getInstance()

  fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
    const rawUrl = request.raw.url ?? '/'
    const pathname = rawUrl.split('?')[0]
    const matchingRule = rules.find((rule) => matchesProxyRule(pathname, rule))

    if (!matchingRule) {
      done()
      return
    }

    reply.hijack()

    const targetUrl = new URL(rawUrl, matchingRule.targetOrigin)
    const proxyRequest = (targetUrl.protocol === 'https:' ? httpsRequest : httpRequest)(
      targetUrl,
      {
        method: request.raw.method,
        headers: {
          ...request.headers,
          host: targetUrl.host,
          connection: 'close',
          'x-forwarded-host': request.headers.host ?? '',
          'x-forwarded-proto': request.protocol,
          'x-forwarded-for': request.ip
        }
      },
      (proxyResponse) => {
        reply.raw.statusCode = proxyResponse.statusCode ?? 502

        Object.entries(proxyResponse.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            reply.raw.setHeader(key, value)
          }
        })

        proxyResponse.pipe(reply.raw)
      }
    )

    proxyRequest.on('error', () => {
      reply.raw.statusCode = 502
      reply.raw.setHeader('Content-Type', 'application/json; charset=utf-8')
      reply.raw.end(JSON.stringify({ message: 'Bad Gateway' }))
    })

    request.raw.pipe(proxyRequest)
  })
}

export async function bootstrapApi(p: BootstrapApiOptions): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(p.rootModule, new FastifyAdapter(), {
    logger: ['error', 'warn', 'log']
  })

  app.enableCors({
    origin: [
      'https://photos.mariage-mickael-valerian.fr',
      'https://l7r.fr',
      'http://localhost:3000',
      'http://localhost:4200',
      'http://localhost:4202'
    ],
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