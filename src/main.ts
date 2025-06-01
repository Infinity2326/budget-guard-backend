import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { setupApp } from './setup-app'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  setupApp(app)

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Budged guard API')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  })

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
