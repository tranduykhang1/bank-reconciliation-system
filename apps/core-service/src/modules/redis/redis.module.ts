import { RedisModule as IORedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
	imports: [
		IORedisModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'single',
				options: {
					host: configService.get<string>('REDIS_HOST'),
					port: +configService.get<number>('REDIS_PORT'),
					username: 'default',
					password: configService.get<string>('REDIS_PASSWORD'),
					db: +configService.get<number>('REDIS_DB'),
				},
			}),
			inject: [ConfigService],
		}),
	],
	controllers: [],
	providers: [RedisService],
	exports: [RedisService],
})
export class RedisModule {}
