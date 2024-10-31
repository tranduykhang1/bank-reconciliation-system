import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';

interface ErrorResponse {
	errorCode: number;
	message: string;
	timestamp: Date;
	path: string;
	stack: string;
}

@Catch(HttpException)
export class GlobalHttpException implements ExceptionFilter {
	constructor(private configService: ConfigService) {}
	private readonly logger = new Logger(GlobalHttpException.name);

	catch(exception: HttpException, host: ArgumentsHost) {
		const ctx: HttpArgumentsHost = host.switchToHttp();
		const response: Response = ctx.getResponse<Response>();
		const request: Request = ctx.getRequest<Request>();
		const exceptionResponse: any = exception.getResponse() as Record<
			string,
			unknown
		>;

		const status: HttpStatus =
			exceptionResponse.statusCode ?? HttpStatus.BAD_REQUEST;
		const errorCode = exceptionResponse?.errorCode ?? status;

		const message =
			typeof exceptionResponse.message === 'string'
				? exceptionResponse.message
				: (exceptionResponse.message?.[0] ??
					'Have an error. Please try again!');

		const errorResponse: ErrorResponse = {
			errorCode,
			message,
			timestamp: new Date(),
			path: request.url,
			stack: exception.stack,
		};

		this.handleDevEnvironment(
			request,
			exception,
			errorResponse,
			response,
			status,
		);
		return;
	}

	private handleDevEnvironment(
		request: Request,
		exception: HttpException,
		errorResponse: ErrorResponse,
		response: Response,
		status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
	) {
		this.logger.error(
			` Request Error: ${request.method} Request URL: ${request.url}`,
			exception.stack,
		);

		response.status(status).json(errorResponse);
	}
}
