import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString } from 'class-validator';

export class OffsetPaginationDto {
  @ApiPropertyOptional({ example: '1', description: 'Page number (starts at 1)' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ example: '10', description: 'Items per page' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export interface OffsetPaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class OffsetPagination {
  static parse(dto: OffsetPaginationDto) {
    const page = parseInt(dto.page || '1', 10);
    const limit = parseInt(dto.limit || '10', 10);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  static meta(total: number, page: number, limit: number): OffsetPaginationMeta {
    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
