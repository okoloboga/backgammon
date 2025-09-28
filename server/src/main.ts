import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GameService } from './game/game.service';
import * as http from 'http';

async function bootstrap() {
  console.log("\n\n--- SHELDON'S DEBUG MESSAGE: BOOTSTRAP STARTED ---\n\n");
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Initialize Colyseus
  const gameService = app.get(GameService);
  gameService.initialize(app.getHttpServer() as http.Server);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Backgammon API')
    .setDescription(
      'API for online backgammon game with TON blockchain integration',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication via TON wallet')
    .addTag('Users', 'User management')
    .addTag('Transactions', 'TON transactions')
    .addTag('TON', 'TON blockchain integration')
    .addTag('Game', 'Game server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Server running on http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Swagger docs available at http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}
void bootstrap();
