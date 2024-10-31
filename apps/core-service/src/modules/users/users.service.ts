import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
	) {}
	async create(createUserDto: CreateUserDto) {
		try {
			return await this.userModel.create(createUserDto);
		} catch (err) {
			throw err;
		}
	}

	async findOneBy(filter: FilterQuery<User>, strict = false) {
		try {
			const user = await this.userModel.findOne(filter);

			if (strict && !user) {
				throw new NotFoundException('User not found');
			}
			return user;
		} catch (err) {
			throw err;
		}
	}
}
