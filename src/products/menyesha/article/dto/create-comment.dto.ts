import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  content!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  authorEmail?: string;
}
