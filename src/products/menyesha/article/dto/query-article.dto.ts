import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { OffsetPaginationDto } from '../../../../common/pagination';
import { CursorPaginationDto } from '../../../../common/pagination';

export class QueryArticleDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ example: 'keyword', description: 'Search articles by title' })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ example: true, description: 'Filter by sponsored articles' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSponsored?: boolean;
}

export class CursorQueryArticleDto extends CursorPaginationDto {
  @ApiPropertyOptional({ example: 'keyword', description: 'Search articles by title' })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({ example: true, description: 'Filter by sponsored articles' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSponsored?: boolean;
}
