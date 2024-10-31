import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload, LoginResponse } from './login.interface';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { Password } from '../../common/utils/password.util';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { SuccessResponse } from '../../common/types/response.type';
import { USER_ROLE } from '../../common/enums/user.enum';
import { RedisService } from '../redis/redis.service';
import { REDIS_KEY } from '../../common/enums/redis.enum';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		private readonly redisService: RedisService,
	) {}

	async login({ email, password }: LoginDto): Promise<LoginResponse> {
		try {
			const user = await this.usersService.findOneBy({ email });

			if (!user || !Password.compare(password, user.key, user.password))
				throw new UnauthorizedException('Wrong credentials!');

			const payload: JwtPayload = {
				id: user._id,
				role: user.role,
			};

			const accessToken = await this.signToken(payload);

			await this.redisService.set(
				REDIS_KEY.USER_LOGGED_IN + user._id.toString(),
				{
					accessToken,
				},
				60 * 60 * 24 * 30,
			);
			return {
				accessToken,
			};
		} catch (err) {
			throw err;
		}
	}

	async register(data: RegisterDto): Promise<SuccessResponse> {
		try {
			const user = await this.usersService.findOneBy({
				email: data.email,
			});

			if (user) throw new ConflictException('User already exists');

			const { key, encryptedData } = Password.encrypt(data.password);

			const userCreation: Partial<User> = {
				...data,
				role: USER_ROLE.CLIENT,
				key,
				password: encryptedData,
			};

			await this.usersService.create(userCreation);

			return {
				message: 'User created successfully',
			};
		} catch (err) {
			throw err;
		}
	}

	async signToken(payload: JwtPayload): Promise<string> {
		return this.jwtService.signAsync(payload);
	}
}
