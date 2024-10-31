import { TestBed } from '@automock/jest';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

describe('UsersService', () => {
	let usersService: UsersService;
	let userModel: jest.Mocked<Model<User>>;

	beforeEach(() => {
		const { unit, unitRef } = TestBed.create(UsersService).compile();

		usersService = unit;
		userModel = unitRef.get<jest.Mocked<Model<User>>>(getModelToken(User.name));
	});

	it('should be defined', () => {
		expect(usersService).toBeDefined();
		expect(userModel).toBeDefined();
	});

	describe('create', () => {
		it('should create a new user', async () => {
			const userCreation: CreateUserDto = {
				email: 'test@example.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
			};
			const createdUser: Partial<User> = {
				...userCreation,
			};
			userModel.create.mockResolvedValueOnce(createdUser as any);

			const result = await usersService.create(userCreation);

			expect(result).toEqual(createdUser);
			expect(userModel.create).toHaveBeenCalledWith(userCreation);
		});
	});

	describe('findOneById', () => {
		it('should find a user by filter', async () => {
			const user: Partial<User> = {
				email: 'test@example.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
			};
			jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(user);

			const result = await usersService.findOneBy({ email: user.email });

			expect(result).toEqual(user);
		});
	});
});
