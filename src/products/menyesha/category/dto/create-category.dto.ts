import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryTranslationDto {
  @ApiProperty({ example: 'Technology' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Articles about technology' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'en', enum: ['en', 'fr', 'rw'] })
  @IsNotEmpty()
  @IsIn(['en', 'fr', 'rw'], { message: 'Language must be one of: en, fr, rw' })
  language!: string;
}

export class CreateCategoryDto {
  @ApiProperty({
    type: [CategoryTranslationDto],
    example: [
      { name: 'Technology', description: 'Tech articles', language: 'en' },
      { name: 'Technologie', description: 'Articles technologiques', language: 'fr' },
      { name: 'Ikoranabuhanga', description: 'Inyandiko z\'ikoranabuhanga', language: 'rw' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations!: CategoryTranslationDto[];
}
