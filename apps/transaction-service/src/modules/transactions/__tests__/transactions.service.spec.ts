import { TestBed } from '@automock/jest';
import { faker } from '@faker-js/faker';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { getModelToken } from '@nestjs/mongoose';
import { QueueBatchData } from 'apps/libs/types/queue.type';
import { Model, Types } from 'mongoose';
import {
	BATCH_PROCESS_QUEUE,
	COMPENSATION_QUEUE,
	RBMQ_EXCHANGE,
	SEND_BATCH_PROCESS,
	SEND_FAILED_MESSAGE,
} from '../../../../../libs/constants/rabbitmq.constants';
import { Transaction } from '../entity/transaction.entity';
import { TransactionsService } from '../transactions.service';

describe('TransactionsService', () => {
	let transactionsService: TransactionsService,
		transactionModel: jest.Mocked<Model<Transaction>>,
		amqpConnection: jest.Mocked<AmqpConnection>;

	beforeEach(() => {
		const { unit, unitRef } = TestBed.create(TransactionsService).compile();

		transactionsService = unit;
		amqpConnection = unitRef.get(AmqpConnection);
		transactionModel = unitRef.get<jest.Mocked<Model<Transaction>>>(
			getModelToken(Transaction.name),
		);
	});

	it('should be defined', () => {
		expect(transactionsService).toBeDefined();
	});

	describe('saveBatchProcess', () => {
		it('should save batch process', async () => {
			const data = {
				batch: [
					{
						date: '2022-01-01',
						content: faker.lorem.paragraphs(),
						amount: '-100',
						type: 'Deposit',
					},
				],
				transactionLogId: new Types.ObjectId(),
				totalRecords: 10000,
			};

			const result = {
				insertedCount: 1,
			};

			transactionModel.bulkWrite.mockResolvedValueOnce(result as any);

			await transactionsService.saveBatchProcess(data);

			expect(transactionModel.bulkWrite).toHaveBeenCalledWith(
				data.batch.map((record) => ({
					insertOne: {
						document: {
							...record,
							transactionLogId: data.transactionLogId,
						},
					},
				})),
			);

			expect(amqpConnection.publish).toHaveBeenCalledWith(
				RBMQ_EXCHANGE,
				SEND_BATCH_PROCESS,
				{
					transactionLogId: data.transactionLogId,
					records: result.insertedCount,
					totalRecords: data.totalRecords,
				},
				{
					queue: BATCH_PROCESS_QUEUE,
				},
			);
		});
		it('should throw an error and call compensation if bulkWrite fails', async () => {
			const data = {
				batch: [
					{
						date: '2022-01-01',
						content: 'Test content',
						amount: '-100',
						type: 'Deposit',
					},
				],
				transactionLogId: new Types.ObjectId(),
				totalRecords: 10000,
			};

			await expect(
				transactionsService.saveBatchProcess(data),
			).rejects.toBeInstanceOf(Error);
			expect(amqpConnection.publish).toHaveBeenCalledWith(
				RBMQ_EXCHANGE,
				SEND_FAILED_MESSAGE,
				{
					transactionLogId: data.transactionLogId,
				} as QueueBatchData,
				{
					queue: COMPENSATION_QUEUE,
				},
			);
		});
	});
});
