import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { CreateArticleDto } from './create-article.dto';

export class UpdateArticleDto extends PartialType(CreateArticleDto) {
  @ApiPropertyOptional({
    example: 'InReview',
    enum: ['Draft', 'InReview', 'Published', 'Rejected', 'Archived'],
  })
  @IsOptional()
  @IsIn(['Draft', 'InReview', 'Published', 'Rejected', 'Archived'])
  status?: string;
}
