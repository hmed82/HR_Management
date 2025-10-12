import {
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Injectable
} from "@nestjs/common";
import { UsersService } from '@/users/users.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
    constructor(private readonly userService: UsersService) { }
    async intercept(context: ExecutionContext, next: CallHandler) {
        const request = context.switchToHttp().getRequest()
        const { userId } = request.session
        if (userId) {
            const user = await this.userService.findById(userId)
            request.currentUser = user
        }
        return next.handle()
    }
}

// make it get the current user form the jwt and not the session