import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ArticleTagsDto {
  @ApiProperty({
    example: ['clxxxxxxxxxxxxxxxxx'],
    description: 'Array of tag IDs',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  tagIds!: string[];
}
