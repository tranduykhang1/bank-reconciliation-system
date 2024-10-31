import { TestBed } from '@automock/jest';
import { faker } from '@faker-js/faker';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { REDIS_KEY } from '../../../../src/common/enums/redis.enum';
import { RedisService } from '../../redis/redis.service';
import { TransactionLog } from '../entity/transaction-logs.entity';
import { TransactionLogsService } from '../transaction-logs.service';

describe('TransactionLogsService', () => {
	let transactionLogsService: TransactionLogsService;
	let redisService: jest.Mocked<RedisService>;
	let transactionLogModel: jest.Mocked<Model<TransactionLog>>;

	beforeEach(() => {
		const { unit, unitRef } = TestBed.create(TransactionLogsService).compile();

		transactionLogsService = unit;
		redisService = unitRef.get(RedisService);
		transactionLogModel = unitRef.get<jest.Mocked<Model<TransactionLog>>>(
			getModelToken(TransactionLog.name),
		);
	});

	it('should be defined', () => {
		expect(transactionLogsService).toBeDefined();
	});

	describe('create', () => {
		const createTransactionLogDto: Partial<TransactionLog> = {
			desc: faker.lorem.sentence(),
			createdBy: new Types.ObjectId(),
			startedAt: new Date('2024-10-01'),
		};
		it('should create a new transaction log', async () => {
			transactionLogModel.create.mockResolvedValueOnce(
				createTransactionLogDto as any,
			);

			const result = await transactionLogsService.create(
				createTransactionLogDto,
			);

			expect(result).toEqual(createTransactionLogDto);
		});

		it('should throw the error when creating failed', async () => {
			transactionLogModel.create.mockRejectedValueOnce(
				new Error('Mongo Error'),
			);

			await expect(
				transactionLogsService.create(createTransactionLogDto),
			).rejects.toEqual(new Error('Mongo Error'));
		});
	});

	describe('updateById', () => {
		const id = new Types.ObjectId();
		const updateTransactionLogDto: Partial<TransactionLog> = {
			desc: faker.lorem.sentence(),
			createdBy: new Types.ObjectId(),
		};
		it('should update a transaction log by id', async () => {
			transactionLogModel.findByIdAndUpdate.mockResolvedValueOnce(
				updateTransactionLogDto as any,
			);

			const result = await transactionLogsService.updateById(
				id,
				updateTransactionLogDto,
			);

			expect(transactionLogModel.findByIdAndUpdate).toHaveBeenCalledWith(
				id,
				updateTransactionLogDto,
			);
			expect(result).toEqual(updateTransactionLogDto);
		});

		it('should throw the error when updating failed', async () => {
			transactionLogModel.findByIdAndUpdate.mockRejectedValueOnce(
				new Error('Mongo Error'),
			);

			await expect(
				transactionLogsService.updateById(id, updateTransactionLogDto),
			).rejects.toEqual(new Error('Mongo Error'));
		});
	});

	describe('updateBatchProcess', () => {
		it('should update the batch process in redis', async () => {
			const transactionLogId = new Types.ObjectId();
			const records = 10;
			const totalRecords = 1_000_000;
			const processedRecords = 2000;

			redisService.get.mockResolvedValueOnce({
				processedRecords,
				totalRecords,
				isCompleted: false,
			});

			await transactionLogsService.updateBatchProcess({
				transactionLogId,
				records,
				totalRecords,
			});

			expect(redisService.set).toHaveBeenCalledWith(
				REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
				{
					processedRecords: processedRecords + records,
					totalRecords,
					isCompleted: false,
				},
				60 * 60 * 24,
			);
		});

		it('should update the batch process to DB', async () => {
			const transactionLogId = new Types.ObjectId();
			const records = 2000;
			const totalRecords = 1_000_000;
			const processedRecords = 998_000;

			redisService.get.mockResolvedValueOnce({
				processedRecords,
				totalRecords,
				isCompleted: false,
			});

			await transactionLogsService.updateBatchProcess({
				transactionLogId,
				records,
				totalRecords,
			});

			expect(redisService.set).toHaveBeenCalledWith(
				REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
				{
					processedRecords: processedRecords + records,
					totalRecords,
					isCompleted: true,
				},
				60 * 60 * 24,
			);

			expect(redisService.delete).toHaveBeenCalledWith(
				REDIS_KEY.TRANSACTION_LOG + transactionLogId.toString(),
			);
		});
	});
});
