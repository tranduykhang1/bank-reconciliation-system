import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema()
export class Transaction {
	@Prop({ type: String, required: true })
	date: string;

	@Prop({ type: String })
	content: string;

	@Prop({ type: String, required: true })
	amount: string;

	@Prop({ type: String, required: true })
	type: string;

	@Prop({ type: Types.ObjectId, required: true })
	transactionLogId: Types.ObjectId;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
