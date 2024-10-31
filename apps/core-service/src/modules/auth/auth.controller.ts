import { Body, Controller, Post } from '@nestjs/common';
import {
	ApiConflictResponse,
	ApiCreatedResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './guards/jwt-auth.guard';

@Controller('auth')
@ApiTags('AUTH')
@Public()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@ApiCreatedResponse({
		example: {
			accessToken: 'string',
		},
	})
	@ApiOperation({
		summary: 'Login as a client',
	})
	@ApiUnauthorizedResponse()
	@Post('login')
	login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}

	@ApiCreatedResponse({
		example: {
			message: 'success',
		},
	})
	@ApiConflictResponse({
		example: {
			message: 'User already exists',
		},
	})
	@ApiOperation({
		summary: 'Create a new user',
	})
	@Post('register')
	register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}
}
