import { forwardRef, Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { TransactionLogsModule } from '../transaction-logs/transaction-logs.module';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
	imports: [TransactionLogsModule, forwardRef(() => QueueModule)],
	controllers: [FilesController],
	providers: [FilesService],
	exports: [FilesService],
})
export class FilesModule {}
