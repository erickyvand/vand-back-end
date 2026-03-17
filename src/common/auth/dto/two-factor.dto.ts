import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiJ9...' })
  @IsString()
  @IsNotEmpty()
  tempToken!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6)
  otp!: string;
}

export class TwoFactorPasswordDto {
  @ApiProperty({ example: 'mypassword' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
