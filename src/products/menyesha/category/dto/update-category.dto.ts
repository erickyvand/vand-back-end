import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'sport-group-id', description: 'Parent category groupId (null to make top-level)' })
  @IsOptional()
  @IsString()
  parentGroupId?: string | null;

  @ApiPropertyOptional({ example: 'Articles about technology' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'en', enum: ['en', 'fr', 'rw'] })
  @IsOptional()
  @IsIn(['en', 'fr', 'rw'], { message: 'Language must be one of: en, fr, rw' })
  language?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
