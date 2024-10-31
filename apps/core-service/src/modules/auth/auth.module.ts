import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { RedisModule } from '../redis/redis.module';

@Module({
	imports: [
		ConfigModule,
		PassportModule,
		JwtModule.registerAsync({
			useFactory: (configService: ConfigService) => ({
				global: true,
				secret: configService.get<string>('JWT_SECRET'),
				signOptions: { expiresIn: configService.get<string>('AT_EXPIRE') },
			}),
			imports: [ConfigModule],
			inject: [ConfigService],
		}),
		RedisModule,
		UsersModule,
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
