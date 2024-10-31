import { UnsupportedMediaTypeException } from '@nestjs/common';
import { Request } from 'express';

export const excelFileFilter = (
	_: Request,
	file: Express.Multer.File,
	callback: (error: Error | null, acceptFile: boolean) => void,
) => {
	if (!file.originalname.match(/\.(xlsx|xls|csv)$/)) {
		callback(
			new UnsupportedMediaTypeException('Only excel or csv files are allowed!'),
			false,
		);
	} else {
		callback(null, true);
	}
};
