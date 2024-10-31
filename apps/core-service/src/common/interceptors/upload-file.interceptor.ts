import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { excelFileFilter } from '../utils/file-filter.util';

interface CustomFilesInterceptorOptions {
	fieldName: string;
	path?: string;
	limitSize?: number;
}

function CustomFilesInterceptor(
	options: CustomFilesInterceptorOptions,
): Type<NestInterceptor> {
	@Injectable()
	class Interceptor implements NestInterceptor {
		fileInterceptor: NestInterceptor;
		constructor() {
			const { fieldName, limitSize } = options;

			const multerOptions: MulterOptions = {
				limits: { fileSize: limitSize },
				storage: diskStorage({
					destination: (req, file, cb) => {
						cb(null, 'uploads/');
					},
					filename: (req, file, callback) => {
						callback(null, file.originalname);
					},
				}),
				fileFilter: excelFileFilter,
			};

			this.fileInterceptor = new (FileInterceptor(fieldName, multerOptions))();
		}

		intercept(...args: Parameters<NestInterceptor['intercept']>) {
			return this.fileInterceptor.intercept(...args);
		}
	}
	return mixin(Interceptor);
}

export default CustomFilesInterceptor;
