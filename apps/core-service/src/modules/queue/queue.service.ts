import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
	BATCH_PROCESS_QUEUE,
	BATCH_QUEUE,
	COMPENSATION_QUEUE,
	FILE_PROCESS_QUEUE,
	RBMQ_EXCHANGE,
	SEND_BATCH_PROCESS,
	SEND_FAILED_MESSAGE,
	SEND_UPLOADED_FILE,
} from '../../../../libs/constants/rabbitmq.constants';
import { QueueBatchData } from '../../../../libs/types/queue.type';
import { TRANSACTION_LOG_STATUS } from '../../common/enums/transaction-logs.enum';
import { FileProcessData } from '../files/file.interface';
import { FilesService } from '../files/files.service';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';

@Injectable()
export class QueueService {
	constructor(
		private readonly amqpConnection: AmqpConnection,

		private readonly transactionLogsService: TransactionLogsService,

		@Inject(forwardRef(() => FilesService))
		private filesServices: FilesService,
	) {}
	async sendToQueue<T>(routingKey: string, data: T, queue = BATCH_QUEUE) {
		try {
			await this.amqpConnection.publish(
				RBMQ_EXCHANGE,
				routingKey,
				Buffer.from(JSON.stringify(data)),
				{
					queue,
				},
			);
		} catch (err) {
			throw new Error(err);
		}
	}

	@RabbitSubscribe({
		exchange: RBMQ_EXCHANGE,
		queue: BATCH_PROCESS_QUEUE,
		routingKey: SEND_BATCH_PROCESS,
	})
	async receiveBatchProcess(data: QueueBatchData): Promise<void> {
		try {
			await this.transactionLogsService.updateBatchProcess(data);
		} catch (err) {
			await this.transactionLogsService.updateById(data.transactionLogId, {
				status: TRANSACTION_LOG_STATUS.FAILED,
				desc: 'Failed to update batch process',
			});
			throw new Error(err);
		}
	}

	@RabbitSubscribe({
		exchange: RBMQ_EXCHANGE,
		queue: FILE_PROCESS_QUEUE,
		routingKey: SEND_UPLOADED_FILE,
	})
	async receiveFieProcess(data: FileProcessData): Promise<void> {
		try {
			await this.filesServices.processAndSendChunk(data);
		} catch (err) {
			throw new Error(err);
		}
	}

	@RabbitSubscribe({
		exchange: RBMQ_EXCHANGE,
		queue: COMPENSATION_QUEUE,
		routingKey: SEND_FAILED_MESSAGE,
	})
	async compensationProcess(data: FileProcessData): Promise<void> {
		try {
			await this.transactionLogsService.updateById(data.transactionLogId, {
				status: TRANSACTION_LOG_STATUS.FAILED,
				desc: 'Failed to insert the records to database',
			});
			return;
		} catch (err) {
			throw new Error(err);
		}
	}
}
