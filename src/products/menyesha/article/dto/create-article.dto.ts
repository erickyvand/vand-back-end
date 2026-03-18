import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsIn,
  IsArray,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'Breaking News: Major Event Unfolds' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'A brief summary of the article' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional({
    example: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Article body text here.' }],
        },
      ],
    },
    description: 'Tiptap JSON content (ProseMirror document format). Required for normal articles, optional for breaking news.',
  })
  @IsOptional()
  content?: any;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  thumbnailId?: string;

  @ApiProperty({ example: 'en', enum: ['en', 'fr', 'rw'] })
  @IsNotEmpty()
  @IsIn(['en', 'fr', 'rw'], { message: 'Language must be one of: en, fr, rw' })
  language!: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxxxxxxxxxxxx',
    description: 'Required for normal articles, optional for breaking news',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    example: ['clxxxxxxxxxxxxxxxxx'],
    description: 'Array of tag IDs to associate with the article',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ example: true, description: 'Mark as breaking news' })
  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  @ApiPropertyOptional({
    example: '2026-03-11T18:00:00.000Z',
    description: 'When breaking news expires',
  })
  @IsOptional()
  @IsDateString()
  breakingUntil?: string;

  @ApiPropertyOptional({ example: true, description: 'Mark as sponsored content' })
  @IsOptional()
  @IsBoolean()
  isSponsored?: boolean;

  @ApiPropertyOptional({ example: 'Bank of Kigali', description: 'Name of the sponsor' })
  @IsOptional()
  @IsString()
  sponsoredBy?: string;

  @ApiPropertyOptional({
    example: '2026-06-01T00:00:00.000Z',
    description: 'When sponsorship expires',
  })
  @IsOptional()
  @IsDateString()
  sponsoredUntil?: string;
}
