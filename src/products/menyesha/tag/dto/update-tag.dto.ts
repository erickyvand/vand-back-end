import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TagTranslationDto } from './create-tag.dto';

export class UpdateTagDto {
  @ApiPropertyOptional({ example: 'Premier League' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    type: [TagTranslationDto],
    description: 'Replaces all translations',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TagTranslationDto)
  translations?: TagTranslationDto[];
}
