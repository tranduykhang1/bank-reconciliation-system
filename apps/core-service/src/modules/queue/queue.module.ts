import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
	BATCH_PROCESS_QUEUE,
	BATCH_QUEUE,
	COMPENSATION_QUEUE,
	FILE_PROCESS_QUEUE,
	RBMQ_EXCHANGE,
} from '../../../../libs/constants/rabbitmq.constants';
import { FilesModule } from '../files/files.module';
import { TransactionLogsModule } from '../transaction-logs/transaction-logs.module';
import { QueueService } from './queue.service';

@Module({
	imports: [
		RabbitMQModule.forRootAsync(RabbitMQModule, {
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				exchanges: [
					{
						name: RBMQ_EXCHANGE,
						type: 'direct',
					},
				],
				uri: configService.get<string>('RABBITMQ_URI'),
				queues: [
					{
						name: BATCH_QUEUE,
						noAck: true,
						options: {
							durable: true,
						},
					},
					{
						name: BATCH_PROCESS_QUEUE,
						noAck: true,
						options: {
							durable: true,
						},
					},
					{
						name: COMPENSATION_QUEUE,
						noAck: true,
						options: {
							durable: true,
						},
					},
					{
						name: FILE_PROCESS_QUEUE,
						noAck: true,
						options: {
							durable: true,
						},
					},
				],
				connectionManagerOptions: {
					heartbeatIntervalInSeconds: 60 * 5,
				},
				connectionInitOptions: {
					wait: true,
				},
			}),
			inject: [ConfigService],
		}),
		ConfigModule,
		TransactionLogsModule,
		forwardRef(() => FilesModule),
	],
	controllers: [],
	providers: [QueueService],
	exports: [QueueService],
})
export class QueueModule {}
