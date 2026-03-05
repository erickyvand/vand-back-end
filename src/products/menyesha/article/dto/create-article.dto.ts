import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ example: 'Breaking News: Major Event Unfolds' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'A brief summary of the article' })
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiProperty({
    example: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Article body text here.' }],
        },
      ],
    },
    description: 'Tiptap JSON content (ProseMirror document format)',
  })
  @IsNotEmpty()
  content!: any;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  thumbnailId?: string;

  @ApiProperty({ example: 'en', enum: ['en', 'fr', 'rw'] })
  @IsNotEmpty()
  @IsIn(['en', 'fr', 'rw'], { message: 'Language must be one of: en, fr, rw' })
  language!: string;

  @ApiProperty({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsNotEmpty()
  @IsString()
  categoryId!: string;
}
