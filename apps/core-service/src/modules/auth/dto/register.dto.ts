import {
	IsEmail,
	IsOptional,
	IsString,
	MaxLength,
	MinLength,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
	@ApiProperty({ description: 'Email', example: 'john@bank.com' })
	@IsEmail()
	email: string;

	@ApiProperty({
		description: 'Password',
		example: '123123123',
		minLength: 6,
		maxLength: 12,
	})
	@IsString()
	@MinLength(6)
	@MaxLength(12)
	password: string;

	@ApiProperty({
		description: 'First name',
		example: 'John',
		minLength: 1,
		maxLength: 12,
	})
	@IsString()
	@MinLength(1)
	@MaxLength(12)
	firstName: string;

	@ApiPropertyOptional({
		description: 'Last name',
		example: 'Doe',
		minLength: 1,
		maxLength: 12,
	})
	@IsOptional()
	@IsString()
	@MinLength(1)
	@MaxLength(12)
	lastName?: string;
}
