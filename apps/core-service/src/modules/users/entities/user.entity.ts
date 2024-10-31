import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { USER_ROLE } from '../../../common/enums/user.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
	@Prop({ type: String, required: true, min: 1, max: 100 })
	firstName: string;

	@Prop({ type: String })
	lastName: string;

	@Prop({ type: String, required: true, unique: true })
	email: string;

	@Prop({ type: String, required: true })
	key: string;

	@Prop({ type: String, required: true })
	password: string;

	@Prop({ type: () => USER_ROLE, required: true })
	role: USER_ROLE;
}

export const UserSchema = SchemaFactory.createForClass(User);
