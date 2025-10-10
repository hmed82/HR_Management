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
import { ClassType } from '@/common/interfaces/class-type.interface';// updated import path bacause of the new typescript config :    path mapping in tsconfig.json
// import { ClassType } from '../interfaces/class-type.interface'; // old import path

export function Serialize(dto: ClassType) {
    if (typeof dto !== 'function') {
        throw new InternalServerErrorException(
            'Serialize() expects a class constructor, not a primitive type.'
        );
    }
    return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor implements NestInterceptor {
    constructor(private readonly dto: ClassType) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // Code to run before the request is handled by the controller
        return next.handle().pipe(
            map((data) => {
                // Code to run after the controller has returned a response
                if (data === null || data === undefined) {
                    return null;
                }

                return plainToInstance(this.dto, data, {
                    excludeExtraneousValues: true,
                });
            }),
        );
    }
}