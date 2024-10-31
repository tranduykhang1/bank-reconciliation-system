import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
	@ApiProperty({
		type: String,
		example: 'client@bank.com',
	})
	@IsEmail()
	readonly email: string;

	@ApiProperty({
		type: String,
		example: '123123123',
	})
	@IsString()
	@MinLength(6)
	@MaxLength(12)
	readonly password: string;
}
