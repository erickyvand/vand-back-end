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

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  authorId?: string;
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

  @ApiPropertyOptional({ example: 'clxxxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  authorId?: string;
}
