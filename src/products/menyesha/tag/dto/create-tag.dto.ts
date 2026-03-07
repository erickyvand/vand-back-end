import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsIn,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TagTranslationDto {
  @ApiProperty({ example: 'Technology' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'en', enum: ['en', 'fr', 'rw'] })
  @IsNotEmpty()
  @IsIn(['en', 'fr', 'rw'], { message: 'Language must be one of: en, fr, rw' })
  language!: string;
}

export class CreateTagDto {
  @ApiProperty({
    type: [TagTranslationDto],
    example: [
      { name: 'Technology', language: 'en' },
      { name: 'Technologie', language: 'fr' },
      { name: 'Ikoranabuhanga', language: 'rw' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TagTranslationDto)
  translations!: TagTranslationDto[];
}
