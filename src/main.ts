import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const config = app.get(ConfigService)

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')))

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  )

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Budged guard API')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup('swagger', app, documentFactory)
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  })

  await app.listen(process.env.PORT ?? 3000)
}
void bootstrap()
