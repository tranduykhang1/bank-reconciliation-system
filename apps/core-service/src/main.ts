import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CoreServiceModule } from './core-service.module';

async function bootstrap() {
	const app = await NestFactory.create(CoreServiceModule);

	app.setGlobalPrefix(`api`);
	app.enableCors();
	app.useGlobalPipes(
		new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
	);

	const config = new DocumentBuilder()
		.setTitle('Bank Reconciliation Service')
		.setDescription('Includes related APIs')
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api-docs', app, documentFactory);

	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: ['1'],
	});

	await app.listen(process.env.SERVICE_PORT ?? 3000);
}
bootstrap();
