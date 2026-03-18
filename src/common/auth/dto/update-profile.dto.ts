import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: 'https://cdn.vand.rw/avatars/photo.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ example: 'Senior journalist covering East Africa politics.' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'https://x.com/johndoe' })
  @IsOptional()
  @IsUrl()
  xLink?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/johndoe' })
  @IsOptional()
  @IsUrl()
  linkedinLink?: string;
}
