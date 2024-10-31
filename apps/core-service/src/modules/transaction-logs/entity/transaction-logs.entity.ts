import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TRANSACTION_LOG_STATUS } from '../../../common/enums/transaction-logs.enum';
import { User } from '../../users/entities/user.entity';
import { Types } from 'mongoose';

export type TransactionLogDocument = TransactionLog & Document;

@Schema({ collection: 'transaction_logs' })
export class TransactionLog {
	_id: Types.ObjectId;

	@Prop({ type: Number, default: 0 })
	processedRecords: number;

	@Prop({ type: Number, default: 0 })
	totalRecords: number;

	@Prop({ type: String, default: '' })
	desc?: string;

	@Prop({ type: Date })
	startedAt: Date;

	@Prop({ type: Date, default: null })
	endedAt: Date;

	@Prop({
		type: () => TRANSACTION_LOG_STATUS,
		required: true,
		default: TRANSACTION_LOG_STATUS.PROCESSING,
	})
	status: TRANSACTION_LOG_STATUS;

	@Prop({ ref: User.name, type: Types.ObjectId, required: true })
	createdBy: Types.ObjectId;
}

export const TransactionLogSchema =
	SchemaFactory.createForClass(TransactionLog);
