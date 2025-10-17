import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class PaginationDto {
    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @Type(() => Number)  // Convert string to number
    @IsInt()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)  // Prevent users from requesting too many items
    limit: number = 10;
}