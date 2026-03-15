import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic paginated response envelope.
 * Wraps any list of items together with pagination metadata.
 */
export class PageDto<T> {
  @ApiProperty({ isArray: true })
  content: T[];

  @ApiProperty()
  totalElements: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrevious: boolean;

  constructor(params: {
    content: T[];
    totalElements: number;
    page: number;
    size: number;
  }) {
    this.content = params.content;
    this.totalElements = params.totalElements;
    this.page = params.page;
    this.size = params.size;
    this.totalPages = Math.ceil(params.totalElements / params.size) || 1;
    this.hasNext = params.page < this.totalPages - 1;
    this.hasPrevious = params.page > 0;
  }
}
