import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { Seeder } from 'nestjs-seeder';
import { Password } from '../utils/password.util';
import { User } from '../../modules/users/entities/user.entity';
import { USER_ROLE } from '../enums/user.enum';
import { faker } from '@faker-js/faker';

@Injectable()
export class UserSeeder implements Seeder {
	private logger: Logger = new Logger(UserSeeder.name);
	constructor(
		@InjectModel(User.name)
		private readonly userModel: Model<User>,
	) {}

	async seed(): Promise<any> {
		const items: Partial<User>[] = [];

		for (let i = 1; i <= 2; i++) {
			let role = USER_ROLE.CLIENT,
				email = 'client@bank.com';

			if (i === 2) {
				role = USER_ROLE.ADMIN;
				email = 'admin@bank.com';
			}

			const hashData = Password.encrypt('123123123');

			items.push({
				firstName: faker.person.firstName(),
				lastName: faker.person.lastName(),
				email,
				password: hashData.encryptedData,
				key: hashData.key,
				role,
			});
		}

		await this.userModel.insertMany(items);
		this.logger.verbose('User seeded successfully');
	}

	async drop(): Promise<any> {
		await this.userModel.deleteMany({});
	}
}
