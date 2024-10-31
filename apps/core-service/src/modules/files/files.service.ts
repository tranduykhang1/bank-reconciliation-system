import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import * as xlsx from 'xlsx';
import {
	FILE_PROCESS_QUEUE,
	SEND_BATCH,
	SEND_UPLOADED_FILE,
} from '../../../../libs/constants/rabbitmq.constants';
import { TRANSACTION_LOG_STATUS } from '../../common/enums/transaction-logs.enum';
import { JwtPayload } from '../auth/login.interface';
import { QueueService } from '../queue/queue.service';
import { TransactionLog } from '../transaction-logs/entity/transaction-logs.entity';
import { TransactionLogsService } from '../transaction-logs/transaction-logs.service';
import { FileProcessData, FileQueueData } from './file.interface';

@Injectable()
export class FilesService {
	private logger: Logger = new Logger(FilesService.name);
	private BATCH_SIZE = 5000;

	constructor(
		private readonly transactionLogsService: TransactionLogsService,
		@Inject(forwardRef(() => QueueService))
		private queueService: QueueService,
	) {}

	async uploadFile(file: Express.Multer.File, createdUser: JwtPayload) {
		try {
			if (!file) {
				throw new BadRequestException('Missing file');
			}
			const transactionLog: TransactionLog =
				await this.transactionLogsService.create({
					createdBy: createdUser.id,
				});

			await this.queueService.sendToQueue<FileProcessData>(
				SEND_UPLOADED_FILE,
				{
					transactionLogId: transactionLog._id,
					filePath: file.path,
				},
				FILE_PROCESS_QUEUE,
			);
			this.logger.verbose(`Start uploaded success: ${file.originalname}`);

			return {
				message: `Import success. The file is being processed with ID=${transactionLog._id.toString()}`,
			};
		} catch (err) {
			throw err;
		}
	}

	async readFileFromPath(filePath: any): Promise<Record<string, any>[]> {
		return new Promise((resolve, reject) => {
			const stream = fs.createReadStream(filePath);
			const chunks: any[] = [];

			stream.on('data', (chunk) => chunks.push(chunk));
			stream.on('end', () => {
				const buffer = Buffer.concat(chunks);
				const workbook = xlsx.read(buffer, { type: 'buffer' });
				const worksheet = workbook.Sheets[workbook.SheetNames[0]];

				const data = xlsx.utils.sheet_to_json(worksheet);
				resolve(data);
			});
			stream.on('error', (error) => {
				reject(error);
			});
		});
	}

	async processAndSendChunk({ filePath, transactionLogId }: FileProcessData) {
		this.logger.verbose(
			`Start processing file for transactionLogID=${transactionLogId.toString()}`,
		);
		try {
			const data = await this.readFileFromPath(filePath);

			if (data.length === 0) {
				await this.transactionLogsService.updateById(transactionLogId, {
					status: TRANSACTION_LOG_STATUS.FAILED,
					desc: 'Dataset is empty',
				});
				throw new BadRequestException('Empty file');
			}

			await this.transactionLogsService.updateById(transactionLogId, {
				totalRecords: data.length,
			});

			for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
				const batch = data.slice(i, i + this.BATCH_SIZE);

				await this.queueService.sendToQueue<FileQueueData>(SEND_BATCH, {
					batch,
					transactionLogId,
					isCompleted: i + this.BATCH_SIZE >= data.length,
					totalRecords: data.length,
				});
			}

			this.logger.verbose(
				`End processing file for transactionLogID=${transactionLogId.toString()}`,
			);
		} catch (err) {
			this.logger.error(
				`Error processing file for transactionLogID=${transactionLogId.toString()}`,
				err,
			);
			await this.transactionLogsService.updateById(transactionLogId, {
				status: TRANSACTION_LOG_STATUS.FAILED,
				desc: 'Failed to process a imported file',
			});
			throw new BadRequestException('Import failed!. Please try again.');
		} finally {
			fs.unlinkSync(filePath);
		}
	}
}
