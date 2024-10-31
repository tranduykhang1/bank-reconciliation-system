import { NestFactory } from '@nestjs/core';
import { TransactionsServiceModule } from '../transaction-service.module';

async function bootstrap() {
	const app = await NestFactory.create(TransactionsServiceModule);
	await app.listen(process.env.SERVICE_PORT ?? 3000);
}
bootstrap();
