import { applyDecorators, UseInterceptors } from '@nestjs/common';
import CustomFilesInterceptor from '../interceptors/upload-file.interceptor';

export function CustomUploadFile(
	fileName: string,
	limitSize = 1 * 1024 * 1024 * 1024, // 1GB
) {
	return applyDecorators(
		UseInterceptors(
			CustomFilesInterceptor({
				fieldName: fileName,
				limitSize,
			}),
		),
	);
}
