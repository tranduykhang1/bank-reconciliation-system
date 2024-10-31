import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueueBatchData } from '../../../../libs/types/queue.type';
import { Mutex } from 'async-mutex';
import { Model, Types } from 'mongoose';
import { REDIS_KEY } from '../../common/enums/redis.enum';
import { TRANSACTION_LOG_STATUS } from '../../common/enums/transaction-logs.enum';
import { CachedTransactionLog } from '../../common/types/transaction-log.type';
import { RedisService } from '../redis/redis.service';
import { TransactionLog } from './entity/transaction-logs.entity';

@Injectable()
export class TransactionLogsService {
	private mutex;
	constructor(
		@InjectModel(TransactionLog.name)
		private readonly transactionLogModel: Model<TransactionLog>,

		private redisService: RedisService,
	) {
		this.mutex = new Mutex();
	}

	async create(
		createTransactionLogDto: Partial<TransactionLog>,
	): Promise<TransactionLog> {
		try {
			return await this.transactionLogModel.create({
				...createTransactionLogDto,
				startedAt: new Date(),
			});
		} catch (err) {
			throw err;
		}
	}

	async updateById(
		id: Types.ObjectId,
		updateTransactionLogDto: Partial<TransactionLog>,
	): Promise<TransactionLog> {
		try {
			return await this.transactionLogModel.findByIdAndUpdate(
				id,
				updateTransactionLogDto,
			);
		} catch (err) {
			throw err;
		}
	}

	async updateBatchProcess({
		transactionLogId,
		records,
		totalRecords,
	}: QueueBatchData) {
		const release = await this.mutex.acquire();
		try {
			const cachedTransactionLog =
				await this.redisService.get<CachedTransactionLog>(
					REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
				);
			const currentProcess =
				(cachedTransactionLog?.processedRecords || 0) + records;
			await this.redisService.set<CachedTransactionLog>(
				REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
				{
					processedRecords: currentProcess,
					totalRecords,
					isCompleted: currentProcess === totalRecords,
				},
				60 * 60 * 24,
			);
			if (currentProcess === totalRecords) {
				await Promise.all([
					this.updateById(transactionLogId, {
						status: TRANSACTION_LOG_STATUS.SUCCESS,
						endedAt: new Date(),
						processedRecords: totalRecords,
					}),
					this.redisService.delete(
						REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
					),
				]);
			}
			return;
		} catch (err) {
			throw err;
		} finally {
			release();
		}
	}
}
