import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
	BATCH_PROCESS_QUEUE,
	BATCH_QUEUE,
	COMPENSATION_QUEUE,
	RBMQ_EXCHANGE,
	SEND_BATCH,
	SEND_BATCH_PROCESS,
	SEND_FAILED_MESSAGE,
} from '../../../../libs/constants/rabbitmq.constants';
import { QueueBatchData } from '../../../../libs/types/queue.type';
import { Transaction } from './entity/transaction.entity';

@Injectable()
export class TransactionsService {
	private logger: Logger = new Logger(TransactionsService.name);
	constructor(
		private readonly amqpConnection: AmqpConnection,
		@InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
	) {}

	@RabbitSubscribe({
		exchange: RBMQ_EXCHANGE,
		queue: BATCH_QUEUE,
		routingKey: SEND_BATCH,
	})
	public async saveBatchProcess(data: {
		batch: Record<string, unknown>[];
		transactionLogId: Types.ObjectId;
		totalRecords: number;
	}) {
		try {
			const result = await this.transactionModel.bulkWrite(
				data.batch.map((record) => ({
					insertOne: {
						document: {
							...record,
							transactionLogId: data.transactionLogId,
						},
					},
				})),
			);

			this.logger.verbose(`Saving ${result.insertedCount} records...`);
			await this.amqpConnection.publish(
				RBMQ_EXCHANGE,
				SEND_BATCH_PROCESS,
				{
					transactionLogId: data.transactionLogId,
					records: result.insertedCount,
					totalRecords: data.totalRecords,
				} as QueueBatchData,
				{
					queue: BATCH_PROCESS_QUEUE,
				},
			);
		} catch (err) {
			await this.amqpConnection.publish(
				RBMQ_EXCHANGE,
				SEND_FAILED_MESSAGE,
				{
					transactionLogId: data.transactionLogId,
				} as QueueBatchData,
				{
					queue: COMPENSATION_QUEUE,
				},
			);
			throw err;
		}
	}
}
