import {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
  UseInterceptors,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { plainToInstance } from 'class-transformer';
import { ClassType } from '@/common/interfaces/class-type.interface';

export function Serialize(dto: ClassType) {
  if (typeof dto !== 'function') {
    throw new InternalServerErrorException(
      'Serialize() expects a class constructor, not a primitive type.',
    );
  }
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
  constructor(private readonly dto: ClassType) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Code to run before the request is handled by the controller
    return next.handle().pipe(
      map((data) => {
        // Code to run after the controller has returned a response
        if (data === null || data === undefined) {
          return null;
        }

        // Check if response is a paginated result from nestjs-paginate
        // Paginated responses have: { data: [...], meta: {...}, links: {...} }
        if (this.isPaginatedResponse(data)) {
          return {
            ...data, // Preserve meta, links, and other properties
            data: plainToInstance(this.dto, data.data, {
              excludeExtraneousValues: true,
            }), // Transform only the data array
          };
        }

        // Check if response is an array (for non-paginated list endpoints)
        if (Array.isArray(data)) {
          return plainToInstance(this.dto, data, {
            excludeExtraneousValues: true,
          });
        }

        // For single entity responses
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }

  // Helper method to detect nestjs-paginate response structure
  //  Checks for presence of 'data', 'meta', and 'links' properties
  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      'meta' in data &&
      'links' in data &&
      Array.isArray(data.data)
    );
  }
}
