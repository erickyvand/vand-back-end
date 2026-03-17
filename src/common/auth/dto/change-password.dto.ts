import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsBoolean, Equals } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'temporaryPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'MyNewSecurePassword1!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiProperty({
    example: true,
    description: 'Must be true — confirms acceptance of terms and conditions',
  })
  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms and conditions' })
  acceptTerms!: boolean;
}
