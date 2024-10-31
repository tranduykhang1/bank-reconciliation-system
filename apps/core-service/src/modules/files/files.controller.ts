import { Controller, Post, UploadedFile } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiCreatedResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { CustomUploadFile } from '../../common/decorators/upload-file.decorator';
import { USER_ROLE } from '../../common/enums/user.enum';
import { AuthRoles } from '../auth/decorators/auth-role.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/login.interface';
import { FilesService } from './files.service';

@Controller('files')
@ApiTags('FILES')
export class FilesController {
	constructor(private readonly filesService: FilesService) {}

	@ApiCreatedResponse({
		example: {
			message: 'success',
		},
	})
	@ApiBadRequestResponse()
	@ApiBearerAuth()
	@ApiOperation({
		summary: 'Import transaction as a excel or csv file',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
					description:
						'The file to upload. The file should be a excel or csv file.',
				},
			},
		},
	})
	@AuthRoles(USER_ROLE.CLIENT)
	@Post('import')
	@CustomUploadFile('file')
	processAndSendChunk(
		@UploadedFile() file: Express.Multer.File,
		@CurrentUser() user: JwtPayload,
	) {
		return this.filesService.uploadFile(file, user);
	}
}
