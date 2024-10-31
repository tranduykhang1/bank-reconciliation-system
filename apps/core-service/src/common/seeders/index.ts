import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { seeder } from 'nestjs-seeder';
import { EnvValidationSchema } from '../../../../libs/configs/env.config';
import { User, UserSchema } from '../../modules/users/entities/user.entity';
import { UserSeeder } from './user.seeder';

seeder({
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
		MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
	],
}).run([UserSeeder]);
