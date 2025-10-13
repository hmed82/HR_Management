import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export interface JwtUser {
    id: number;
    role: string;
    isActive: boolean;
}

export const CurrentUser = createParamDecorator(
    (_data: never, context: ExecutionContext): JwtUser | undefined => {
        const request = context.switchToHttp().getRequest();
        return request.user; // Changed from request.currentUser
    }
);