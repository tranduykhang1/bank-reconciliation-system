import { TestBed } from '@automock/jest';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { QueueBatchData } from 'apps/libs/types/queue.type';
import { Types } from 'mongoose';
import { TRANSACTION_LOG_STATUS } from '../../../../src/common/enums/transaction-logs.enum';
import { FileProcessData } from '../../files/file.interface';
import { FilesService } from '../../files/files.service';
import { TransactionLogsService } from '../../transaction-logs/transaction-logs.service';
import { QueueService } from '../queue.service';

describe('QueueService', () => {
	let queueService: QueueService,
		amqpConnection: jest.Mocked<AmqpConnection>,
		transactionLogsService: jest.Mocked<TransactionLogsService>,
		filesService: jest.Mocked<FilesService>;

	beforeAll(() => {
		const { unit, unitRef } = TestBed.create(QueueService).compile();
		queueService = unit;
		amqpConnection = unitRef.get(AmqpConnection);
		transactionLogsService = unitRef.get(TransactionLogsService);
		filesService = unitRef.get(FilesService);
	});

	it('should be defined', () => {
		expect(queueService).toBeDefined();
	});

	describe('sendToQueue', () => {
		it('should call amqpConnection.publish with correct arguments', async () => {
			const routingKey = 'routingKey';
			const data = { key: 'value' };
			const queue = 'queue';

			amqpConnection.publish.mockResolvedValueOnce(null);

			await queueService.sendToQueue(routingKey, data, queue);

			expect(amqpConnection.publish).toHaveBeenCalledWith(
				expect.any(String),
				routingKey,
				Buffer.from(JSON.stringify(data)),
				{
					queue,
				},
			);
		});

		it('should throw error if amqpConnection.publish throws an error', async () => {
			const routingKey = 'routingKey';
			const data = { key: 'value' };
			const queue = 'queue';
			const error = new Error();
			amqpConnection.publish.mockRejectedValueOnce(error);

			await expect(
				queueService.sendToQueue(routingKey, data, queue),
			).rejects.toBeInstanceOf(Error);
		});
	});

	describe('receiveBatchProcess', () => {
		it('should call updateBatchProcess on transactionLogsService', async () => {
			const data: QueueBatchData = {
				transactionLogId: new Types.ObjectId(),
				records: 2000,
				totalRecords: 1_000_000,
			};

			await queueService.receiveBatchProcess(data);

			expect(transactionLogsService.updateBatchProcess).toHaveBeenCalledWith(
				data,
			);
		});

		it('should throw an error if updateBatchProcess throws an error', async () => {
			const data: QueueBatchData = {
				transactionLogId: new Types.ObjectId(),
				records: 2000,
				totalRecords: 1_000_000,
			};

			const error = new Error('Failed to update batch process');
			transactionLogsService.updateBatchProcess.mockRejectedValue(error);

			await expect(
				queueService.receiveBatchProcess(data),
			).rejects.toBeInstanceOf(Error);
		});
	});

	describe('receiveFileProcess', () => {
		it('should call filesService.processAndSendChunk with correct arguments', async () => {
			const data: FileProcessData = {
				filePath: './data.xlsx',
				transactionLogId: new Types.ObjectId(),
			};

			await queueService.receiveFieProcess(data);

			expect(filesService.processAndSendChunk).toHaveBeenCalledWith(data);
		});

		it('should throw error if filesService.processAndSendChunk throws an error', async () => {
			const data: FileProcessData = {
				filePath: './data.csv',
				transactionLogId: new Types.ObjectId(),
			};
			const error = new Error();
			filesService.processAndSendChunk.mockRejectedValueOnce(error);

			await expect(queueService.receiveFieProcess(data)).rejects.toBeInstanceOf(
				Error,
			);
		});
	});

	describe('compensationProcess', () => {
		it('should call updateById on transactionLogsService with correct arguments', async () => {
			const data: FileProcessData = {
				transactionLogId: new Types.ObjectId(),
				filePath: './upload/data.xlsx',
			};

			await queueService.compensationProcess(data);

			expect(transactionLogsService.updateById).toHaveBeenCalledWith(
				data.transactionLogId,
				{
					status: TRANSACTION_LOG_STATUS.FAILED,
					desc: 'Failed to insert the records to database',
				},
			);
		});

		it('should throw an error if updateById throws an error', async () => {
			const data: FileProcessData = {
				transactionLogId: new Types.ObjectId(),
				filePath: './uploads/data.xlsx',
			};

			const error = new Error('Failed to update transaction log');
			transactionLogsService.updateById.mockRejectedValue(error);

			await expect(
				queueService.compensationProcess(data),
			).rejects.toBeInstanceOf(Error);
		});
	});
});
