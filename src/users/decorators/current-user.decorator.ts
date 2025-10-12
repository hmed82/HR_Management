import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from '@/users/entities/user.entity'

export const CurrentUser = createParamDecorator(
    (_data: never, context: ExecutionContext): User | undefined => {
        const request = context.switchToHttp().getRequest()
        return request.currentUser
    }
)