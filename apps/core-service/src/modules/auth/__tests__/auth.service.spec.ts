import { TestBed } from '@automock/jest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { USER_ROLE } from '../../../common/enums/user.enum';
import { Password } from '../../../common/utils/password.util';
import { RedisService } from '../../redis/redis.service';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { JwtPayload } from '../login.interface';

describe('AuthService', () => {
	let authService: AuthService,
		jwtService: jest.Mocked<JwtService>,
		userService: jest.Mocked<UsersService>,
		redisService: jest.Mocked<RedisService>;

	beforeAll(() => {
		const { unit, unitRef } = TestBed.create(AuthService).compile();
		authService = unit;
		jwtService = unitRef.get(JwtService);
		(userService = unitRef.get(UsersService)),
			(redisService = unitRef.get(RedisService));
	});

	it('should be defined', () => {
		expect(authService).toBeDefined();
	});

	describe('signToken', () => {
		it('should return a token response with access and refresh tokens', async () => {
			const payload: JwtPayload = {
				id: new Types.ObjectId(),
				role: USER_ROLE.CLIENT,
			};
			jwtService.signAsync.mockResolvedValueOnce(
				`signed-token-for-${payload.id.toString().toString()}`,
			);

			const tokens = await authService.signToken(payload);

			expect(tokens).toEqual(`signed-token-for-${payload.id.toString()}`);
			expect(jwtService.signAsync).toHaveBeenCalledWith(payload);
		});
	});

	describe('login', () => {
		it('should return a base response with token data', async () => {
			const input: LoginDto = {
				email: 'johndoe@example.com',
				password: 'test',
			};
			const payload: JwtPayload = {
				id: new Types.ObjectId(),
				role: USER_ROLE.CLIENT,
			};

			jwtService.signAsync.mockResolvedValueOnce(
				`signed-token-for-${payload.id.toString()}`,
			);
			userService.findOneBy.mockResolvedValueOnce({
				_id: payload.id.toString(),
				email: 'return@gmail.com',
			} as any);
			redisService.set.mockResolvedValueOnce(null);
			jest.spyOn(Password, 'compare').mockReturnValueOnce(true);

			const result: any = await authService.login(input);

			expect(result.accessToken).toBe(
				`signed-token-for-${payload.id.toString()}`,
			);
		});

		it('should return the error with wrong password', async () => {
			const input: LoginDto = {
				email: 'wrong@example.com',
				password: 'wrong',
			};
			const payload: JwtPayload = {
				id: new Types.ObjectId(),
				role: USER_ROLE.CLIENT,
			};

			jwtService.signAsync.mockResolvedValueOnce(
				`signed-token-for-${payload.id.toString()}`,
			);
			userService.findOneBy.mockResolvedValueOnce({
				email: 'return@gmail.com',
			} as any);
			jest.spyOn(Password, 'compare').mockReturnValueOnce(false);
			await expect(authService.login(input)).rejects.toStrictEqual(
				new UnauthorizedException('Wrong credentials!'),
			);
		});
	});

	describe('register', () => {
		it('should throw an error when the email is already registered', async () => {
			const input: RegisterDto = {
				email: 'duplicate@example.com',
				password: 'password123',
				firstName: '',
				lastName: '',
			};

			userService.findOneBy.mockResolvedValueOnce({
				email: 'return@gmail.com',
			} as any);

			await expect(authService.register(input)).rejects.toThrow(
				new ConflictException('User already exists'),
			);
		});

		it('should register a new user successfully', async () => {
			const input: RegisterDto = {
				email: 'new@example.com',
				password: 'password123',
				firstName: 'John',
				lastName: 'Doe',
			};

			const encryptedPassword = 'encrypted-password';
			const encryptionKey = 'encryption-key';

			jest.spyOn(Password, 'encrypt').mockReturnValueOnce({
				encryptedData: encryptedPassword,
				key: encryptionKey,
			});
			userService.findOneBy.mockResolvedValueOnce(null);

			userService.create.mockResolvedValueOnce({
				email: 'new@example.com',
				password: encryptedPassword,
				key: encryptionKey,
			} as any);

			const result = await authService.register(input);

			expect(result).toEqual({
				message: 'User created successfully',
			});
		});
	});
});
