import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '../redis/redis.module';
import {
	TransactionLog,
	TransactionLogSchema,
} from './entity/transaction-logs.entity';
import { TransactionLogsService } from './transaction-logs.service';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: TransactionLog.name, schema: TransactionLogSchema },
		]),
		RedisModule,
	],
	controllers: [],
	providers: [TransactionLogsService],
	exports: [TransactionLogsService],
})
export class TransactionLogsModule {}
