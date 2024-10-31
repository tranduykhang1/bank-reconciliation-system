import { TestBed } from '@automock/jest';
import { faker } from '@faker-js/faker';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import { Types } from 'mongoose';
import { SEND_BATCH } from '../../../../../libs/constants/rabbitmq.constants';
import { JwtPayload } from '../../auth/login.interface';
import { QueueService } from '../../queue/queue.service';
import { TransactionLogsService } from '../../transaction-logs/transaction-logs.service';
import { FilesService } from '../files.service';

describe('FilesService', () => {
	let filesService: FilesService;
	let queueService: jest.Mocked<QueueService>;
	let transactionLogsService: jest.Mocked<TransactionLogsService>;

	beforeEach(() => {
		const { unit, unitRef } = TestBed.create(FilesService).compile();

		filesService = unit;
		queueService = unitRef.get(QueueService);
		transactionLogsService = unitRef.get(TransactionLogsService);
	});

	describe('uploadFile', () => {
		it('should create and send data to queue', async () => {
			const file = { path: 'path/to/file' } as Express.Multer.File;
			const createdUser = { id: new Types.ObjectId() } as JwtPayload;

			transactionLogsService.create.mockResolvedValue({
				_id: new Types.ObjectId(),
			} as any);
			queueService.sendToQueue.mockResolvedValueOnce(null);

			await filesService.uploadFile(file, createdUser);

			expect(queueService.sendToQueue).toHaveBeenCalled();
			expect(transactionLogsService.create).toHaveBeenCalled();
		});

		it('should show the error when missing file', async () => {
			const file = null as Express.Multer.File;
			const createdUser = { id: new Types.ObjectId() } as JwtPayload;

			await expect(
				filesService.uploadFile(file, createdUser),
			).rejects.toBeInstanceOf(BadRequestException);
		});
	});

	describe('processAndSendChunk', () => {
		const BATCH_SIZE = 5000;
		it('should process and send chunks of data at once', async () => {
			const filePath = './uploads/';
			const transactionLogId = new Types.ObjectId();
			const data = [
				{
					date: '2024-10-01',
					content: 'Test content',
					amount: '100',
					type: 'Deposit',
				},
				{
					date: '2024-10-02',
					content: 'More test content',
					amount: '-50',
					type: 'Withdrawal',
				},
			];

			jest.spyOn(filesService, 'readFileFromPath').mockResolvedValue(data);

			jest.spyOn(fs, 'unlinkSync').mockReturnValueOnce(null);

			await filesService.processAndSendChunk({ filePath, transactionLogId });

			expect(transactionLogsService.updateById).toHaveBeenCalledWith(
				transactionLogId,
				{
					totalRecords: data.length,
				},
			);

			expect(queueService.sendToQueue).toHaveBeenNthCalledWith(1, SEND_BATCH, {
				batch: data.slice(0, BATCH_SIZE),
				transactionLogId,
				isCompleted: true,
				totalRecords: data.length,
			});
		});

		it('should send to queue 2 times', async () => {
			const filePath = './uploads/';
			const transactionLogId = new Types.ObjectId();
			const data = Array.from({ length: 10000 }, () => ({
				date: faker.date.past().toISOString(),
				content: faker.lorem.sentence(),
				amount: (Math.random() * 100000).toFixed(2),
				type: faker.helpers.arrayElement(['Deposit', 'Withdrawal']),
			}));

			jest.spyOn(filesService, 'readFileFromPath').mockResolvedValue(data);

			jest.spyOn(fs, 'unlinkSync').mockReturnValueOnce(null);

			await filesService.processAndSendChunk({ filePath, transactionLogId });

			expect(transactionLogsService.updateById).toHaveBeenCalledWith(
				transactionLogId,
				{
					totalRecords: data.length,
				},
			);

			expect(queueService.sendToQueue).toHaveBeenCalledTimes(
				10000 / BATCH_SIZE,
			);
		});
	});
});
