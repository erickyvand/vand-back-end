import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { OffsetPaginationDto } from '../../common/pagination/offset-pagination.dto';

export class QueryUsersDto extends OffsetPaginationDto {
  @ApiPropertyOptional({ description: 'Filter by role name', example: 'reporter' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
