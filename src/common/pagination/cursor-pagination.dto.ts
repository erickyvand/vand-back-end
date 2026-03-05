import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString } from 'class-validator';

export class CursorPaginationDto {
  @ApiPropertyOptional({ example: '10', description: 'Number of items to return' })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Cursor — ID of the last item from the previous page' })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export class CursorPagination {
  static parse(dto: CursorPaginationDto) {
    const limit = parseInt(dto.limit || '10', 10);
    const cursor = dto.cursor || null;
    return { limit, cursor };
  }

  static query(cursor: string | null, limit: number) {
    return {
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    };
  }

  static result<T extends { id: string }>(items: T[], limit: number) {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data,
      meta: { nextCursor, hasMore, limit } as CursorPaginationMeta,
    };
  }
}
