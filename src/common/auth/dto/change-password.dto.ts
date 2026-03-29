import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsBoolean, IsOptional } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'temporaryPassword123' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'MyNewSecurePassword1!' })
  @IsString()
  @MinLength(8)
  newPassword!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Must be true for non-admin roles — confirms acceptance of terms and conditions',
  })
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}
