import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { OffsetPaginationDto } from '../../../../common/pagination';
import { CursorPaginationDto } from '../../../../common/pagination';

export class QueryArticleDto extends OffsetPaginationDto {
  @ApiPropertyOptional({
    enum: ['Draft', 'InReview', 'Published', 'Rejected', 'Archived'],
  })
  @IsOptional()
  @IsIn(['Draft', 'InReview', 'Published', 'Rejected', 'Archived'])
  status?: string;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'sport', description: 'Filter by parent category slug (includes all subcategories)' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ example: 'africa', description: 'Filter by subcategory slug' })
  @IsOptional()
  @IsString()
  subCategorySlug?: string;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional({ enum: ['en', 'fr', 'rw'] })
  @IsOptional()
  @IsIn(['en', 'fr', 'rw'])
  language?: string;

  @ApiPropertyOptional({ enum: ['Hero', 'Secondary', 'Spotlight'] })
  @IsOptional()
  @IsIn(['Hero', 'Secondary', 'Spotlight'])
  featuredType?: string;
}

export class CursorQueryArticleDto extends CursorPaginationDto {
  @ApiPropertyOptional({
    enum: ['Draft', 'InReview', 'Published', 'Rejected', 'Archived'],
  })
  @IsOptional()
  @IsIn(['Draft', 'InReview', 'Published', 'Rejected', 'Archived'])
  status?: string;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'sport', description: 'Filter by parent category slug (includes all subcategories)' })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({ example: 'africa', description: 'Filter by subcategory slug' })
  @IsOptional()
  @IsString()
  subCategorySlug?: string;

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  authorId?: string;

  @ApiPropertyOptional({ enum: ['en', 'fr', 'rw'] })
  @IsOptional()
  @IsIn(['en', 'fr', 'rw'])
  language?: string;

  @ApiPropertyOptional({ enum: ['Hero', 'Secondary', 'Spotlight'] })
  @IsOptional()
  @IsIn(['Hero', 'Secondary', 'Spotlight'])
  featuredType?: string;
}
