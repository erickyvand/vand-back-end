import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsString, MinLength } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({
    example: 'InReview',
    enum: ['Draft', 'InReview', 'Published', 'Rejected', 'Archived'],
  })
  @IsOptional()
  @IsIn(['Draft', 'InReview', 'Published', 'Rejected', 'Archived'])
  status?: string;

  @ApiPropertyOptional({
    example: 'Hero',
    enum: ['Hero', 'Secondary', 'Spotlight'],
    description: 'Set to null to unfeature',
  })
  @IsOptional()
  @IsIn(['Hero', 'Secondary', 'Spotlight', null])
  featuredType?: string | null;

  @ApiPropertyOptional({
    example: 'The article needs more sources and fact-checking.',
    description: 'Required when rejecting an article',
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Rejection note must be at least 10 characters' })
  rejectionNote?: string;
}
