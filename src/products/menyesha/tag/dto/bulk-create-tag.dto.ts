import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TagTranslationDto } from './create-tag.dto';

export class BulkTagItemDto {
  @ApiProperty({ example: 'Premier League', description: 'English name for the tag' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    type: [TagTranslationDto],
    example: [
      { label: 'Technology', language: 'en' },
      { label: 'Technologie', language: 'fr' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagTranslationDto)
  translations!: TagTranslationDto[];
}

export class BulkCreateTagDto {
  @ApiProperty({
    type: [BulkTagItemDto],
    description: 'Array of tags to create and associate with the article',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkTagItemDto)
  tags!: BulkTagItemDto[];
}
