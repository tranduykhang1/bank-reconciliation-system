import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REDIS_KEY } from '../../../common/enums/redis.enum';
import { RedisService } from '../../redis/redis.service';
import { JwtPayload, LoginResponse } from '../login.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private redisService: RedisService,
		private configService: ConfigService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get<string>('JWT_SECRET'),
			ignoreExpiration: false,
			passReqToCallback: true,
		});
	}

	async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
		try {
			const token = req.headers.authorization.split(' ')[1];
			if (!token) {
				throw new UnauthorizedException('No token provided!');
			}

			const userId = payload.id;
			const decoded = await this.redisService.get<LoginResponse>(
				REDIS_KEY.USER_LOGGED_IN + userId.toString(),
			);

			if (decoded) {
				if (token !== decoded.accessToken) {
					throw new UnauthorizedException();
				}
				return {
					id: payload.id,
					role: payload.role,
				};
			}
			if (token !== decoded.accessToken) {
				throw new UnauthorizedException();
			}
		} catch (err) {
			throw new UnauthorizedException();
		}
	}
}
