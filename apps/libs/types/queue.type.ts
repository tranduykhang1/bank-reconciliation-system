import { Types } from 'mongoose';

export interface QueueBatchData {
	transactionLogId: Types.ObjectId;
	records: number;
	totalRecords: number;
	isCompleted?: boolean;
}
