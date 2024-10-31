import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './entity/transaction.entity';
import { TransactionsService } from './transactions.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Transaction.name, schema: TransactionSchema },
		]),
		RabbitMQModule.forRootAsync(RabbitMQModule, {
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('RABBITMQ_URI'),
			}),
			inject: [ConfigService],
		}),
	],
	providers: [TransactionsService],
})
export class TransactionsModule {}
