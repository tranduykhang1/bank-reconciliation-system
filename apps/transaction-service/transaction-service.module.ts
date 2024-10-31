import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvValidationSchema } from '../libs/configs/env.config';
import { TransactionsModule } from './src/modules/transactions/transactions.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: EnvValidationSchema,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
			}),
			inject: [ConfigService],
		}),
		TransactionsModule,
	],
	controllers: [],
	providers: [],
})
export class TransactionsServiceModule {}
