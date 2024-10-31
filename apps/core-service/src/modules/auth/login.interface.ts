import mongoose from 'mongoose';
import { USER_ROLE } from '../../common/enums/user.enum';

export interface LoginResponse {
	accessToken: string;
}

export interface JwtPayload {
	id: mongoose.Types.ObjectId;
	role: USER_ROLE;
}
