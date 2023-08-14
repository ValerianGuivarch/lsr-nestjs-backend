import { AppModule } from './app.module'
import { createAgent } from '@forestadmin/agent'
import { createSqlDataSource } from '@forestadmin/datasource-sql'
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
  const agent = createAgent({
    authSecret: configService.get('FOREST_AUTH_SECRET'),
    envSecret: configService.get('FOREST_ENV_SECRET'),
    isProduction: configService.get('NODE_ENV') === 'production',
    typingsPath: './typings.ts',
    typingsMaxDepth: 5
  })
    // Create your SQL datasource
    .addDataSource(createSqlDataSource(configService.get('DB_URI')))
  await agent.mountOnNestJs(app).start()

  await app.listen(configService.get('PORT'), configService.get('HOST'))
  console.log(`Application is running on: ${await app.getUrl()}`)
}
bootstrap().then(() => console.log('Application started'))
