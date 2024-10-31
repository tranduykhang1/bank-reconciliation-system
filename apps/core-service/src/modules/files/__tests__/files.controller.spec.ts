import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from '../../queue/queue.service';
import { TransactionLogsService } from '../../transaction-logs/transaction-logs.service';
import { FilesController } from '../files.controller';
import { FilesService } from '../files.service';

describe('FilesController', () => {
	let controller: FilesController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FilesController],
			providers: [
				FilesService,
				{
					provide: TransactionLogsService,
					useValue: {},
				},
				{
					provide: QueueService,
					useValue: {},
				},
			],
		}).compile();

		controller = module.get<FilesController>(FilesController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
