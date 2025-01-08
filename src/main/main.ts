import { AppModule } from './app.module'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    logger: ['error', 'warn', 'log']
  })

  // CORS
  app.enableCors()

  const configService = app.get(ConfigService)
  app.useGlobalPipes(new ValidationPipe())

  const config = new DocumentBuilder()
    .setTitle('Bloom swagger')
    .setDescription('The Starter API swagger')
    .setVersion('1.0')
    .addTag('Starter')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  //  await ForestService.agent.mountOnNestJs(app).start()

  await app.listen(configService.get('PORT'), configService.get('HOST'))
  console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap().then(() => console.log('Application started'))
