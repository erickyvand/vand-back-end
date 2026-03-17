import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateTermsDto {
  @ApiProperty({ example: '1.0.0', description: 'Version identifier for this terms document' })
  @IsString()
  @IsNotEmpty()
  version!: string;

  @ApiProperty({ example: 'By using this platform, you agree to...', description: 'Full terms and conditions content' })
  @IsString()
  @MinLength(50)
  content!: string;
}
