import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvValidationSchema } from '../../libs/configs/env.config';
import { GlobalHttpException } from './common/exceptions/global.exception';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/role.guard';
import { FilesModule } from './modules/files/files.module';
import { QueueModule } from './modules/queue/queue.module';
import { RedisModule } from './modules/redis/redis.module';
import { UsersModule } from './modules/users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: EnvValidationSchema,
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				uri: configService.get<string>('MONGO_URI'),
			}),
			inject: [ConfigService],
		}),
		AuthModule,
		UsersModule,
		RedisModule,
		FilesModule,
		QueueModule,
	],
	controllers: [],
	providers: [
		{
			provide: APP_FILTER,
			useClass: GlobalHttpException,
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		},
	],
})
export class CoreServiceModule {}
