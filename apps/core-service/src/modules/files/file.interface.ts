import { Types } from 'mongoose';

export interface FileChunk {
	date: Date;
	content: string;
	amount: string;
	type: string;
}

export interface FileQueueData {
	batch: Record<string, unknown>[];
	transactionLogId: Types.ObjectId;
	totalRecords: number;
	isCompleted: boolean;
}

export interface FileProcessData {
	transactionLogId: Types.ObjectId;
	filePath: string;
}
